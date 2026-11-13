import { describe, ids, isGone, tabStops } from './aria';
import { type Context, findWidget, requireName, triggerOf } from './context';

// APG's dialog pattern is modal: Tab and Shift+Tab wrap inside it, so they must never leave it
async function checkDialog(ctx: Context, role: 'dialog' | 'alertdialog') {
    const source = role === 'dialog' ? 'dialog (modal)' : 'alert dialog';
    const popup = findWidget(ctx, [role]);
    if (!popup || isGone(popup)) {
        ctx.problem(ctx.root, `没有打开的 ${role}，检查前要先打开它`);
        return;
    }
    ctx.watch(popup);
    requireName(ctx, popup, source);
    if (popup.getAttribute('aria-modal') !== 'true' && !(popup instanceof HTMLDialogElement)) {
        ctx.problem(popup, `没有 aria-modal="true"，模态对话框要告诉读屏软件背后的页面不可操作（APG ${source}）`);
    }
    if (role === 'alertdialog' && !ids(popup, 'aria-describedby').length) {
        ctx.problem(popup, '没有 aria-describedby，alertdialog 要用它指向提示信息（APG alert dialog）');
    }
    const inside = () => popup.contains(ctx.active());
    if (!inside()) {
        ctx.problem(popup, `已打开，但焦点在 ${describe(ctx.active())}，打开对话框后焦点应进入其中（APG ${source}）`);
        return;
    }
    const stops = tabStops(popup).length;
    for (const key of ['Tab', 'Shift+Tab']) {
        for (let press = 0; press <= stops; press++) {
            await ctx.press(key);
            if (!inside()) {
                ctx.problem(popup, `按 ${key} 后焦点跑到了对话框外的 ${describe(ctx.active())}，模态对话框的焦点要在内部循环（APG ${source}）`);
                return;
            }
        }
    }
    if (!ctx.actions) {
        return;
    }
    const trigger = triggerOf(popup);
    await ctx.press('Escape');
    const now = (popup.id && ctx.doc.getElementById(popup.id)) || popup;
    if (!isGone(now)) {
        ctx.problem(popup, `按 Escape 应关闭对话框（APG ${source}）`);
    } else if (trigger && ctx.active() !== trigger) {
        ctx.problem(trigger, `对话框被 Escape 关闭后焦点应回到它，实际在 ${describe(ctx.active())}（APG ${source}）`);
    }
}

export const dialog = (ctx: Context) => checkDialog(ctx, 'dialog');
export const alertdialog = (ctx: Context) => checkDialog(ctx, 'alertdialog');
