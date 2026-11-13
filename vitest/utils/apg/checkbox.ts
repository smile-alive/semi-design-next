import { checkedOf, isDisabled } from './aria';
import { checkToggle, type Context, controls, missing, requireName } from './context';

export async function checkbox(ctx: Context) {
    const boxes = controls(ctx, ['checkbox']);
    if (!boxes.length) {
        return missing(ctx, 'checkbox', 'checkbox');
    }
    for (const box of boxes) {
        requireName(ctx, box, 'checkbox');
        if (!['true', 'false', 'mixed'].includes(checkedOf(box))) {
            ctx.problem(box, `没有 aria-checked，checkbox 取值 "true"、"false" 或 "mixed"（APG checkbox）`);
        }
    }
    if (ctx.actions) {
        for (const box of boxes.filter((el) => !isDisabled(el))) {
            await checkToggle(ctx, box, ' ', () => checkedOf(box), 'aria-checked', 'checkbox');
        }
    }
}
