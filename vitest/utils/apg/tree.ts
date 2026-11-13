import { describe, isDisabled, isUnreachable, withRole } from './aria';
import { checkNavigation, checkTabStop, checkTypeahead, type Composite, currentItem, enter, goTo } from './composite';
import { checkOwned, type Context, findWidget, missing, requireName, requireState } from './context';

const arrows = { next: 'ArrowDown', previous: 'ArrowUp' };

export async function tree(ctx: Context) {
    const box = findWidget(ctx, ['tree']);
    if (!box) {
        return missing(ctx, 'tree', 'tree view');
    }
    requireName(ctx, box, 'tree view');
    checkOwned(ctx, box, ['treeitem'], 'tree view');
    if (box.hasAttribute('aria-multiselectable')) {
        requireState(ctx, box, 'aria-multiselectable', ['true', 'false'], 'tree view');
    }
    const items = withRole(box, ['treeitem'], true);
    if (!items.length) {
        ctx.problem(box, '没有 role=treeitem 的子元素（APG tree view）');
    }
    for (const item of items) {
        const group = withRole(item, ['group'], true).find((el) => el.parentElement?.closest('[role="treeitem"]') === item);
        if (group || item.hasAttribute('aria-owns')) {
            requireState(ctx, item, 'aria-expanded', ['true', 'false'], 'tree view');
        }
    }
    const composite: Composite = { container: box, items: () => withRole(box, ['treeitem']).filter((item) => !isUnreachable(item)), noun: '节点', source: 'tree view' };
    checkTabStop(ctx, composite);
    if (!items.length) {
        return;
    }
    enter(ctx, composite);
    await checkNavigation(ctx, composite, { next: [arrows.next], previous: [arrows.previous], wraps: ctx.wraps('optional'), homeEnd: true });
    await checkBranch(ctx, composite);
    await checkTypeahead(ctx, composite, arrows);
}

// On the first branch: the open key expands it, again moves to its first child; the close key moves back to the parent, then collapses it
async function checkBranch(ctx: Context, composite: Composite) {
    const [open, close] = ctx.options.direction === 'rtl' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft'];
    const branch = composite.items().find((item) => item.hasAttribute('aria-expanded') && !isDisabled(item));
    if (!branch) {
        return;
    }
    await goTo(ctx, composite, branch, arrows);
    if (currentItem(ctx, composite) !== branch) {
        return;
    }
    const expanded = () => branch.getAttribute('aria-expanded') === 'true';
    if (!expanded()) {
        await ctx.press(open);
        if (!expanded()) {
            ctx.problem(branch, `按 ${open} 应展开收起的分支（APG tree view）`);
        } else if (currentItem(ctx, composite) !== branch) {
            ctx.problem(branch, `按 ${open} 展开分支后焦点应留在它上面（APG tree view）`);
        }
    }
    if (expanded()) {
        const all = composite.items();
        const next = all[all.indexOf(branch) + 1];
        const level = Number(branch.getAttribute('aria-level'));
        const isChild = !!next && (branch.contains(next) || (!!level && Number(next.getAttribute('aria-level')) === level + 1));
        if (isChild) {
            await ctx.press(open);
            if (currentItem(ctx, composite) !== next) {
                ctx.problem(branch, `展开的分支上按 ${open} 应移到它的第一个子节点 ${describe(next)}（APG tree view）`);
            } else {
                await ctx.press(close);
                if (currentItem(ctx, composite) !== branch) {
                    ctx.problem(next, `子节点上按 ${close} 应移到它的父节点 ${describe(branch)}（APG tree view）`);
                }
            }
        }
    }
    if (currentItem(ctx, composite) === branch) {
        await ctx.press(close);
        if (expanded()) {
            ctx.problem(branch, `展开的分支上按 ${close} 应收起它（APG tree view）`);
        }
    }
}
