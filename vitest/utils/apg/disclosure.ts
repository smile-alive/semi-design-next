import { byId, ids, isDisabled, isGone, roleOf, withRole } from './aria';
import { checkToggle, type Context, requireName, requireState } from './context';

const expandedOf = (el: Element) => el.getAttribute('aria-expanded') ?? '';

async function checkKeys(ctx: Context, button: Element, source: string) {
    for (const key of ['Enter', ' ']) {
        await checkToggle(ctx, button, key, () => expandedOf(button), 'aria-expanded', source);
    }
}

export async function disclosure(ctx: Context) {
    const buttons = [ctx.root, ...ctx.root.querySelectorAll('[aria-expanded]')].filter((el) => el.hasAttribute('aria-expanded') && !isGone(el));
    if (!buttons.length) {
        ctx.problem(ctx.root, '没有带 aria-expanded 的按钮，不是 disclosure');
        return;
    }
    for (const button of buttons) {
        if (roleOf(button) !== 'button') {
            ctx.problem(button, '用来显示和隐藏内容，应是 button（APG disclosure）');
        }
        requireName(ctx, button, 'disclosure');
        requireState(ctx, button, 'aria-expanded', ['true', 'false'], 'disclosure');
    }
    const button = buttons.find((el) => !isDisabled(el));
    if (button && ctx.actions) {
        await checkKeys(ctx, button, 'disclosure');
    }
}

export async function accordion(ctx: Context) {
    const buttons = withRole(ctx.root, ['button']).filter((el) => el.hasAttribute('aria-expanded'));
    if (!buttons.length) {
        ctx.problem(ctx.root, '没有带 aria-expanded 的标题按钮，不是 accordion');
        return;
    }
    for (const button of buttons) {
        requireName(ctx, button, 'accordion');
        requireState(ctx, button, 'aria-expanded', ['true', 'false'], 'accordion');
        const heading = button.closest('h1, h2, h3, h4, h5, h6, [role=heading]');
        if (!heading || !ctx.root.contains(heading)) {
            ctx.problem(button, '不在标题元素里，每个标题按钮要包在 role=heading 的元素中（APG accordion）');
        } else if (heading.getAttribute('role') === 'heading' && !heading.hasAttribute('aria-level')) {
            ctx.problem(heading, 'role=heading 的元素没有 aria-level（APG accordion）');
        }
        if (expandedOf(button) !== 'true') {
            continue;
        }
        const panel = ids(button, 'aria-controls').map((id) => byId(button, id))[0];
        if (!panel) {
            ctx.problem(button, '已展开，但没有用 aria-controls 指向面板（APG accordion）');
        } else if (roleOf(panel) === 'region' && !ids(panel, 'aria-labelledby').length) {
            ctx.problem(panel, 'role=region 的面板没有 aria-labelledby，应由标题按钮命名（APG accordion）');
        }
    }
    const button = buttons.find((el) => !isDisabled(el));
    if (button && ctx.actions) {
        await checkKeys(ctx, button, 'accordion');
    }
}
