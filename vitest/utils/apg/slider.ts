import { accessibleName, isDisabled } from './aria';
import { type Context, controls, missing, orientationOf } from './context';

export async function slider(ctx: Context) {
    const thumbs = controls(ctx, ['slider']);
    if (!thumbs.length) {
        return missing(ctx, 'slider', 'slider');
    }
    for (const thumb of thumbs) {
        if (!accessibleName(thumb)) {
            ctx.problem(thumb, '没有可访问名称，每个滑块手柄都要有自己的 aria-label 或 aria-labelledby（APG slider）');
        }
        const native = thumb instanceof HTMLInputElement;
        if (!native && Number.isNaN(Number(thumb.getAttribute('aria-valuenow') ?? NaN))) {
            ctx.problem(thumb, '没有数值型的 aria-valuenow，读屏软件读的就是它（APG slider）');
        }
        orientationOf(ctx, thumb);
    }
    for (const thumb of thumbs.filter((el) => !isDisabled(el))) {
        await checkKeys(ctx, thumb);
    }
}

async function checkKeys(ctx: Context, thumb: Element) {
    const input = thumb instanceof HTMLInputElement ? thumb : undefined;
    const value = () => Number(thumb.getAttribute('aria-valuenow') ?? input?.value);
    const min = () => Number(thumb.getAttribute('aria-valuemin') ?? (input?.min || 0));
    const max = () => Number(thumb.getAttribute('aria-valuemax') ?? (input?.max || 100));
    if (!input && !Number.isNaN(value()) && (value() < min() || value() > max())) {
        ctx.problem(thumb, `aria-valuenow 为 ${value()}，超出 aria-valuemin ${min()} 到 aria-valuemax ${max()} 的范围（APG slider）`);
    }
    const vertical = orientationOf(ctx, thumb) === 'vertical';
    const [increase, decrease] = vertical ? ['ArrowUp', 'ArrowDown'] : ctx.options.direction === 'rtl' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft'];
    const expectChange = async (key: string, up: boolean) => {
        const before = value();
        await ctx.press(key);
        const after = value();
        if (!(up ? after > before : after < before)) {
            ctx.problem(thumb, `按 ${key} 应${up ? '增大' : '减小'}数值（原值 ${before}），实际为 ${after}（APG slider）`);
        }
    };
    ctx.focus(thumb);
    // Up raises in either orientation. At the maximum each pair lowers first.
    const custom = ctx.options.sliderKeys;
    const pairs = custom
        ? [[custom.increase, custom.decrease]]
        : vertical
          ? [[increase, decrease]]
          : [
                ['ArrowUp', 'ArrowDown'],
                [increase, decrease],
            ];
    for (const [up, down] of pairs) {
        const atMax = value() >= max();
        await expectChange(atMax ? down : up, !atMax);
        await expectChange(atMax ? up : down, atMax);
    }
    await ctx.press('End');
    if (value() !== max()) {
        ctx.problem(thumb, `按 End 应设为最大值 ${max()}，实际为 ${value()}（APG slider）`);
    }
    await ctx.press('Home');
    if (value() !== min()) {
        ctx.problem(thumb, `按 Home 应设为最小值 ${min()}，实际为 ${value()}（APG slider）`);
    }
    // Page keys are optional in the APG: they only have to agree with their direction when the slider reacts to them
    for (const [key, up] of [
        ['PageUp', true],
        ['PageDown', false],
    ] as const) {
        const before = value();
        await ctx.press(key);
        if (value() !== before && value() > before !== up) {
            ctx.problem(thumb, `按 ${key} 应${up ? '增大' : '减小'}数值（原值 ${before}），实际为 ${value()}（APG slider）`);
        }
    }
}
