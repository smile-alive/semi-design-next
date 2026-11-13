import { describe, isGone, isUnreachable, roleOf, tabStops, withRole } from './aria';
import { type Composite, currentItem, expectStep } from './composite';
import { checkOwned, type Context, findWidget, missing, popupOf, requireName, requireState } from './context';

export async function combobox(ctx: Context) {
    const box = findWidget(ctx, ['combobox']);
    if (!box) {
        return missing(ctx, 'combobox', 'combobox');
    }
    requireName(ctx, box, 'combobox');
    requireState(ctx, box, 'aria-expanded', ['true', 'false'], 'combobox');
    if (box.hasAttribute('aria-autocomplete')) {
        requireState(ctx, box, 'aria-autocomplete', ['none', 'list', 'inline', 'both'], 'combobox');
    }
    if (!tabStops(box).includes(box)) {
        ctx.problem(box, '不是 Tab 停靠点，combobox 要能被 Tab 聚焦（APG combobox）');
    }
    const expanded = () => box.getAttribute('aria-expanded') === 'true';
    ctx.focus(box);
    if (!expanded()) {
        await ctx.press('ArrowDown');
    }
    if (!expanded()) {
        // Opening on Down is optional in an editable combobox, so only a select-only one is held to it
        if (!(box instanceof HTMLInputElement)) {
            ctx.problem(box, '按 ArrowDown 应展开弹层，并设置 aria-expanded="true"（APG select-only combobox）');
        }
        return;
    }
    const popup = popupOf(box, ['listbox', 'grid', 'tree', 'dialog']);
    if (!popup || isGone(popup)) {
        ctx.problem(box, '已展开，但 aria-controls 没有指向打开的 listbox、grid、tree 或 dialog（APG combobox）');
        return;
    }
    ctx.watch(popup);
    const kind = roleOf(popup);
    // The popup is a listbox unless aria-haspopup says otherwise (ARIA combobox)
    if (kind !== 'listbox' && box.getAttribute('aria-haspopup') !== kind) {
        ctx.problem(box, `控制的是 ${kind}，应设置 aria-haspopup="${kind}"，只有 listbox 弹层可以省略（APG combobox）`);
    }
    if (kind === 'listbox' || kind === 'tree') {
        const itemRole = kind === 'listbox' ? 'option' : 'treeitem';
        checkOwned(ctx, popup, [itemRole], 'combobox');
        await checkActiveOption(ctx, box, popup, itemRole);
    }
    if (!ctx.actions) {
        return;
    }
    await ctx.press('Escape');
    // A search input shown only while open unmounts on close and hands focus to the combobox that owns it
    const successor = !box.isConnected && ctx.active();
    const now = successor && roleOf(successor) === 'combobox' ? successor : box;
    if (now.getAttribute('aria-expanded') === 'true') {
        ctx.problem(box, '按 Escape 应关闭弹层，并设置 aria-expanded="false"（APG combobox）');
    }
    if (ctx.active() !== now) {
        ctx.problem(box, `弹层被 Escape 关闭后焦点应留在它上面，实际在 ${describe(ctx.active())}（APG combobox）`);
    }
}

// With a listbox popup, DOM focus stays on the combobox while Down and Up move the active option, which aria-activedescendant names
async function checkActiveOption(ctx: Context, box: Element, popup: Element, itemRole: string) {
    const composite: Composite = { container: popup, items: () => withRole(popup, [itemRole]).filter((item) => !isUnreachable(item)), noun: '选项', source: 'combobox' };
    if (!composite.items().length) {
        return;
    }
    const stays = (key: string) => {
        if (ctx.active() !== box) {
            ctx.problem(box, `按 ${key} 后 DOM 焦点移到了 ${describe(ctx.active())}，焦点应留在 combobox 上，用 aria-activedescendant 指向当前选项（APG combobox）`);
        }
        return ctx.active() === box;
    };
    if (!currentItem(ctx, composite)) {
        await ctx.press('ArrowDown');
        if (!stays('ArrowDown')) {
            return;
        }
        if (!currentItem(ctx, composite)) {
            ctx.problem(box, '按 ArrowDown 应让一个选项成为当前项，即 aria-activedescendant 指向它（APG combobox）');
            return;
        }
    }
    await expectStep(ctx, composite, 'ArrowDown', true, 'optional');
    if (stays('ArrowDown')) {
        await expectStep(ctx, composite, 'ArrowUp', false, 'optional');
        stays('ArrowUp');
    }
}
