import { checkedOf, isDisabled } from './aria';
import { checkToggle, type Context, controls, missing, requireName } from './context';

export async function switchPattern(ctx: Context) {
    const switches = controls(ctx, ['switch']);
    if (!switches.length) {
        return missing(ctx, 'switch', 'switch');
    }
    for (const control of switches) {
        requireName(ctx, control, 'switch');
        if (!['true', 'false'].includes(checkedOf(control))) {
            ctx.problem(control, `没有 aria-checked，switch 开启为 "true"、关闭为 "false"（APG switch）`);
        }
    }
    if (ctx.actions) {
        for (const control of switches.filter((el) => !isDisabled(el))) {
            await checkToggle(ctx, control, ' ', () => checkedOf(control), 'aria-checked', 'switch');
        }
    }
}
