import type { UserGuideButtonProps } from './interface.js';

const joinStyles = (...styles: (string | null | undefined)[]) => styles.filter(Boolean).join(';') || undefined;

/** The user's props win over the base; `style` is joined and `onclick` runs before the built-in handler. */
export function buttonProps(base: UserGuideButtonProps, custom: UserGuideButtonProps | undefined, builtIn: () => void): UserGuideButtonProps {
    const { onclick, style, ...rest } = custom ?? {};
    return {
        ...base,
        ...rest,
        style: joinStyles(base.style, style),
        onclick: (event) => {
            onclick?.(event);
            builtIn();
        },
    };
}

export function anchorStyle(rect: DOMRect) {
    return `position:fixed;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;pointer-events:none`;
}
