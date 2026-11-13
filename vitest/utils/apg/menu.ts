import { describe, isDisabled, isGone, roleOf, withRole } from './aria';
import { checkNavigation, checkTabStop, checkTypeahead, type Composite, currentItem, enter, expectStep, goTo } from './composite';
import { arrowsFor, checkOwned, type Context, findWidget, keyLabel, missing, orientationOf, popupOf, requireState, triggerOf } from './context';

const menuItemRoles = ['menuitem', 'menuitemcheckbox', 'menuitemradio'];

/** The items a menu or menubar owns, leaving out those of the menus nested in it. */
const ownItems = (container: Element) => withRole(container, menuItemRoles).filter((item) => item.parentElement?.closest('[role="menu"], [role="menubar"]') === container);

function checkItems(ctx: Context, items: Element[], source: string) {
    for (const item of items) {
        const role = roleOf(item);
        if (role === 'menuitemcheckbox') {
            requireState(ctx, item, 'aria-checked', ['true', 'false', 'mixed'], source);
        } else if (role === 'menuitemradio') {
            requireState(ctx, item, 'aria-checked', ['true', 'false'], source);
        }
        if (item.hasAttribute('aria-haspopup')) {
            requireState(ctx, item, 'aria-expanded', ['true', 'false'], source);
        }
    }
}

/** An open menu, and the button that opened it when the menu names one with aria-controls. */
export async function menu(ctx: Context) {
    const popup = findWidget(ctx, ['menu']);
    if (!popup || isGone(popup)) {
        ctx.problem(ctx.root, '没有打开的菜单，检查前要先打开它');
        return;
    }
    ctx.watch(popup);
    const trigger = triggerOf(popup);
    if (trigger) {
        ctx.watch(trigger);
        requireState(ctx, trigger, 'aria-haspopup', ['menu', 'true'], 'menu button');
        requireState(ctx, trigger, 'aria-expanded', ['true'], 'menu button');
    }
    checkOwned(ctx, popup, menuItemRoles, 'menu');
    const items = ownItems(popup);
    if (!items.length) {
        ctx.problem(popup, '没有 role=menuitem 的子元素（APG menu）');
    }
    checkItems(ctx, items, 'menu');
    const composite: Composite = { container: popup, items: () => ownItems(popup), noun: '菜单项', source: 'menu' };
    // Tab leaves a menu, so its items need no tab stop, but never more than one
    checkTabStop(ctx, composite, false);
    const active = ctx.active();
    if (!popup.contains(active) && !active?.hasAttribute('aria-activedescendant')) {
        ctx.problem(popup, `已打开，但焦点在 ${describe(active)}，打开菜单后焦点应进入菜单（APG menu button）`);
        return;
    }
    if (!items.length) {
        return;
    }
    const arrows = arrowsFor(orientationOf(ctx, popup), ctx.options.direction);
    if (!currentItem(ctx, composite)) {
        await expectStep(ctx, composite, arrows.next, true, 'optional');
    }
    await checkNavigation(ctx, composite, { next: [arrows.next], previous: [arrows.previous], wraps: ctx.wraps('optional'), homeEnd: true });
    await checkTypeahead(ctx, composite, arrows);
    if (!ctx.actions) {
        return;
    }
    await ctx.press('Escape');
    if (!isGone(popup)) {
        ctx.problem(popup, '按 Escape 应关闭菜单（APG menu button）');
    } else if (trigger) {
        if (ctx.active() !== trigger) {
            ctx.problem(trigger, `菜单被 Escape 关闭后焦点应回到它，实际在 ${describe(ctx.active())}（APG menu button）`);
        }
        requireState(ctx, trigger, 'aria-expanded', ['false'], 'menu button');
    }
}

export async function menubar(ctx: Context) {
    const bar = findWidget(ctx, ['menubar']);
    if (!bar) {
        return missing(ctx, 'menubar', 'menubar');
    }
    checkOwned(ctx, bar, menuItemRoles, 'menubar');
    const items = ownItems(bar);
    if (!items.length) {
        ctx.problem(bar, '没有 role=menuitem 的子元素（APG menubar）');
    }
    checkItems(ctx, items, 'menubar');
    const composite: Composite = { container: bar, items: () => ownItems(bar), noun: '菜单项', source: 'menubar' };
    const orientation = orientationOf(ctx, bar);
    const arrows = arrowsFor(orientation, ctx.options.direction);
    checkTabStop(ctx, composite);
    if (items.length < 2) {
        return;
    }
    enter(ctx, composite);
    await checkNavigation(ctx, composite, { next: [arrows.next], previous: [arrows.previous], wraps: ctx.wraps(true), homeEnd: true });
    const opener = composite.items().find((item) => item.hasAttribute('aria-haspopup') && !isDisabled(item));
    if (opener) {
        await goTo(ctx, composite, opener, arrows);
        // The arrow across the bar opens the menu: Down in a horizontal bar, the horizontal arrow in a vertical one (APG menubar)
        await checkSubmenu(ctx, opener, orientation === 'vertical' ? arrowsFor('horizontal', ctx.options.direction).next : 'ArrowDown');
    }
}

// The opening key shows the item's menu with focus inside; Escape closes it with focus back on the item
async function checkSubmenu(ctx: Context, item: Element, key: string) {
    if (ctx.active() !== item) {
        return;
    }
    await ctx.press(key);
    const submenu = popupOf(item, ['menu']);
    if (!submenu || isGone(submenu) || item.getAttribute('aria-expanded') !== 'true') {
        ctx.problem(item, `按 ${keyLabel(key)} 应打开它的菜单，并设置 aria-expanded="true"（APG menubar）`);
        return;
    }
    ctx.watch(submenu);
    if (!submenu.contains(ctx.active())) {
        ctx.problem(submenu, `已打开，但焦点留在 ${describe(ctx.active())}，焦点应进入菜单（APG menubar）`);
    }
    if (!ctx.actions) {
        return;
    }
    await ctx.press('Escape');
    if (!isGone(submenu) && item.getAttribute('aria-expanded') === 'true') {
        ctx.problem(submenu, '按 Escape 应关闭（APG menubar）');
    } else if (ctx.active() !== item) {
        ctx.problem(item, `Escape 关闭菜单后焦点应回到它，实际在 ${describe(ctx.active())}（APG menubar）`);
    }
}
