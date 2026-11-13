import { checkedOf, isDisabled, isUnreachable, withRole } from './aria';
import { checkNavigation, checkTabStop, checkTypeahead, type Composite, currentItem, enter } from './composite';
import { arrowsFor, checkOwned, type Context, findWidget, missing, orientationOf, requireName, requireState } from './context';

const isSelected = (el: Element) => el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-checked') === 'true';

export async function listbox(ctx: Context) {
    const box = findWidget(ctx, ['listbox']);
    if (!box) {
        return missing(ctx, 'listbox', 'listbox');
    }
    ctx.watch(box);
    requireName(ctx, box, 'listbox');
    checkOwned(ctx, box, ['option'], 'listbox');
    if (box.hasAttribute('aria-multiselectable')) {
        requireState(ctx, box, 'aria-multiselectable', ['true', 'false'], 'listbox');
    }
    const multiple = box.getAttribute('aria-multiselectable') === 'true';
    const options = withRole(box, ['option']);
    if (!options.length) {
        ctx.problem(box, '没有 role=option 的子元素（APG listbox）');
    }
    for (const option of options) {
        if (!option.hasAttribute('aria-selected') && !(multiple && option.hasAttribute('aria-checked'))) {
            ctx.problem(option, '没有 aria-selected，可选项要声明自己是否选中，取值 "true" 或 "false"（APG listbox）');
        }
    }
    if (!multiple && options.filter(isSelected).length > 1) {
        ctx.problem(box, `没有 aria-multiselectable="true" 却有 ${options.filter(isSelected).length} 个选中项（APG listbox）`);
    }
    const composite: Composite = { container: box, items: () => withRole(box, ['option']).filter((option) => !isUnreachable(option)), noun: '选项', source: 'listbox' };
    const arrows = arrowsFor(orientationOf(ctx, box), ctx.options.direction);
    checkTabStop(ctx, composite);
    if (options.length < 2) {
        return;
    }
    enter(ctx, composite);
    await checkNavigation(ctx, composite, { next: [arrows.next], previous: [arrows.previous], wraps: ctx.wraps('optional'), homeEnd: true });
    await checkTypeahead(ctx, composite, arrows);
    if (ctx.actions && box.getAttribute('aria-readonly') !== 'true' && !isDisabled(box)) {
        await checkSpaceSelects(ctx, composite, arrows.next, multiple);
    }
}

// Space selects the current option, or toggles it in a multi-select listbox; a listbox whose selection follows focus has nothing to press on
async function checkSpaceSelects(ctx: Context, composite: Composite, next: string, multiple: boolean) {
    let option = currentItem(ctx, composite);
    if (option && (isSelected(option) || isDisabled(option))) {
        await ctx.press(next);
        option = currentItem(ctx, composite);
    }
    if (!option || isSelected(option) || isDisabled(option)) {
        return;
    }
    await ctx.press(' ');
    if (checkedOf(option) !== 'true' && !isSelected(option)) {
        ctx.problem(option, `按 Space 应选中${multiple ? '或切换' : ''}获得焦点的选项（APG listbox）`);
    }
}
