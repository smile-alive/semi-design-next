import { checkedOf, describe, isDisabled, tabStops, withRole } from './aria';
import { checkNavigation, checkTabStop, type Composite, enter } from './composite';
import { checkOwned, type Context, findWidget, missing, requireName, requireState } from './context';

const isChecked = (el: Element) => checkedOf(el) === 'true';

export async function radioGroup(ctx: Context) {
    const group = findWidget(ctx, ['radiogroup']);
    if (!group) {
        return missing(ctx, 'radiogroup', 'radio group');
    }
    requireName(ctx, group, 'radio group');
    checkOwned(ctx, group, ['radio'], 'radio group');
    const radios = withRole(group, ['radio']);
    if (!radios.length) {
        ctx.problem(group, '没有 role=radio 的子元素（APG radio group）');
    }
    for (const radio of radios) {
        if (!(radio instanceof HTMLInputElement)) {
            requireState(ctx, radio, 'aria-checked', ['true', 'false'], 'radio group');
        }
    }
    const checked = radios.filter(isChecked);
    if (checked.length > 1) {
        ctx.problem(group, `有 ${checked.length} 个选中的 radio，最多一个（APG radio group）`);
    }
    const composite: Composite = { container: group, items: () => withRole(group, ['radio']), noun: 'radio', source: 'radio group' };
    checkTabStop(ctx, composite);
    const stop = tabStops(group)[0];
    if (stop && checked[0] && !isDisabled(checked[0]) && stop !== checked[0]) {
        ctx.problem(stop, `承担了 Tab 焦点，应由选中的 ${describe(checked[0])} 承担（APG radio group）`);
    }
    if (radios.length < 2) {
        return;
    }
    const start = enter(ctx, composite);
    // Space checks the focused radio when it is not checked yet
    if (ctx.actions && start && !isChecked(start) && !isDisabled(start)) {
        await ctx.press(' ');
        if (!isChecked(start)) {
            ctx.problem(start, '按 Space 应选中获得焦点的 radio（APG radio group）');
        }
    }
    // Down and Right move forward, Up and Left back, with the horizontal pair swapped right to left
    const [forward, back] = ctx.options.direction === 'rtl' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft'];
    await checkNavigation(ctx, composite, {
        next: ['ArrowDown', forward],
        previous: ['ArrowUp', back],
        wraps: ctx.wraps(true),
        homeEnd: false,
        onMove: (key, radio) => {
            if (!isChecked(radio) && !isDisabled(radio)) {
                ctx.problem(radio, `按 ${key} 移到该 radio 后应同时选中它（APG radio group）`);
            }
        },
    });
}
