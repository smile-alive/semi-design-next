import { byId, describe, ids, isDisabled, isGone, roleOf, tabStops, withRole } from './aria';
import { checkNavigation, checkTabStop, type Composite, enter, expectStep } from './composite';
import { arrowsFor, checkOwned, type Context, findWidget, keyLabel, missing, orientationOf, requireName, requireState } from './context';

const isSelected = (el: Element) => el.getAttribute('aria-selected') === 'true';

// A tab names its panel with aria-controls, and the panel is a tabpanel labelled by that tab
function checkPanels(ctx: Context, tabs: Element[]) {
    for (const tab of tabs) {
        const panels = ids(tab, 'aria-controls').flatMap((id) => byId(tab, id) ?? []);
        if (isSelected(tab) && !panels.length) {
            ctx.problem(tab, '已选中，但没有用 aria-controls 指向 tabpanel（APG tabs）');
        }
        for (const panel of panels) {
            if (roleOf(panel) !== 'tabpanel') {
                ctx.problem(tab, `aria-controls 指向的 ${describe(panel)} 不是 tabpanel（APG tabs）`);
                continue;
            }
            if (!tab.id || !ids(panel, 'aria-labelledby').includes(tab.id)) {
                ctx.problem(panel, `应通过 aria-labelledby 指向它的 tab ${describe(tab)}（APG tabs）`);
            }
            // The unselected side is not checked: whether a panel is hidden may live in a stylesheet the test does not load
            if (isSelected(tab) && isGone(panel)) {
                ctx.problem(panel, '对应的 tab 已选中，面板却是隐藏的（APG tabs）');
            }
        }
    }
}

export async function tabs(ctx: Context) {
    const list = findWidget(ctx, ['tablist']);
    if (!list) {
        return missing(ctx, 'tablist', 'tabs');
    }
    requireName(ctx, list, 'tabs');
    checkOwned(ctx, list, ['tab'], 'tabs');
    const all = withRole(list, ['tab']);
    if (!all.length) {
        ctx.problem(list, '没有 role=tab 的子元素（APG tabs）');
    }
    for (const tab of all) {
        requireState(ctx, tab, 'aria-selected', ['true', 'false'], 'tabs');
    }
    const selected = all.filter(isSelected);
    if (selected.length > 1) {
        ctx.problem(list, `有 ${selected.length} 个已选中的 tab，同一时刻只有一个（APG tabs）`);
    }
    checkPanels(ctx, all);
    const composite: Composite = { container: list, items: () => withRole(list, ['tab']), noun: 'tab', source: 'tabs' };
    const arrows = arrowsFor(orientationOf(ctx, list), ctx.options.direction);
    checkTabStop(ctx, composite);
    const stop = tabStops(list)[0];
    if (stop && selected[0] && !isDisabled(selected[0]) && stop !== selected[0]) {
        ctx.problem(stop, `承担了 Tab 焦点，应由已选中的 ${describe(selected[0])} 承担（APG tabs）`);
    }
    if (all.length < 2) {
        return;
    }
    enter(ctx, composite);
    // Automatic activation selects a tab as it takes focus. It is optional, so the check is that a widget does it for every move or none
    const activated = new Set<boolean>();
    await checkNavigation(ctx, composite, {
        next: [arrows.next],
        previous: [arrows.previous],
        wraps: ctx.wraps(true),
        homeEnd: true,
        onMove: (_key, tab) => {
            if (!isDisabled(tab) && tab !== selected[0]) {
                activated.add(isSelected(tab));
            }
        },
    });
    if (activated.size > 1) {
        ctx.problem(list, '焦点移到 tab 时有时选中它、有时不选，自动激活要么每次都做，要么都不做（APG tabs）');
    }
    checkPanels(ctx, composite.items());
    if (!ctx.actions) {
        return;
    }
    // A manual-activation tab selects on Enter or Space
    for (const key of ['Enter', ' ']) {
        let tab = await expectStep(ctx, composite, arrows.next, true, ctx.wraps(true));
        if (isSelected(tab) || isDisabled(tab)) {
            tab = await expectStep(ctx, composite, arrows.next, true, ctx.wraps(true));
        }
        if (isSelected(tab) || isDisabled(tab)) {
            continue;
        }
        await ctx.press(key);
        if (!isSelected(tab)) {
            ctx.problem(tab, `按 ${keyLabel(key)} 应激活获得焦点的 tab（APG tabs）`);
        }
        checkPanels(ctx, composite.items());
    }
}
