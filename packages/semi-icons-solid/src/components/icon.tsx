import { mergeProps, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '../env';
import type { IconProps } from './interface';
import { registerIcon, useIconSlot } from './slot';
import '@fibrae/semi-icons-core/styles/icons.scss';

export default function Icon(props: IconProps) {
    const slot = useIconSlot();
    const merged = mergeProps({ spin: false, prefixCls: BASE_CLASS_PREFIX } as const, props);
    const [local, rest] = splitProps(merged, ['svg', 'size', 'spin', 'rotate', 'prefixCls', 'type', 'fill', 'class', 'style']);
    const prefix = () => `${local.prefixCls}-icon`;
    // an explicit size wins over the slot's
    const size = () => local.size ?? slot?.size?.() ?? 'default';
    // Decorative unless named (the type is no screen-reader name); a focusable icon stays exposed, since hiding it
    // leaves a silent tab stop and a11y checks flag it so the caller adds an aria-label
    const exposed = () => Boolean(rest['aria-label'] || rest['aria-labelledby']) || Number(rest.tabIndex ?? rest.tabindex) >= 0;
    const style = () => {
        const transform = Number.isSafeInteger(local.rotate) ? `rotate(${local.rotate}deg)` : undefined;
        if (typeof local.style === 'string') {
            return transform ? `transform: ${transform}; ${local.style}` : local.style;
        }
        return transform ? { transform, ...local.style } : local.style;
    };
    return registerIcon(
        slot,
        <span
            role={exposed() ? 'img' : undefined}
            aria-hidden={exposed() ? undefined : true}
            class={clsx(
                prefix(),
                {
                    [`${prefix()}-${size()}`]: size() !== 'inherit',
                    [`${prefix()}-spinning`]: local.spin,
                    [`${prefix()}-${local.type}`]: Boolean(local.type),
                },
                slot?.class?.(),
                local.class
            )}
            style={style()}
            {...rest}
        >
            <Dynamic component={local.svg} fill={local.fill} />
        </span>
    );
}
