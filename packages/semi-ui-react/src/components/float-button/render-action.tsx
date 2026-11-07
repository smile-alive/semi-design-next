import type React from 'react';

export interface ActionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onClick'> {
    href?: string;
    target?: string;
    rel?: string;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    ref?: React.Ref<HTMLButtonElement | HTMLAnchorElement>;
    [dataAttribute: `data-${string}`]: string | undefined;
}

/**
 * A link when `href` is set, otherwise a native button. A link has no native disabled state: a disabled one drops
 * `href` so it cannot be followed or focused, and takes `role="link"` with `aria-disabled` so screen readers still
 * announce it.
 */
export default function renderAction({ href, target, rel, disabled, onClick, ref, children, ...attrs }: ActionProps) {
    if (href) {
        return (
            <a {...attrs} ref={ref as React.Ref<HTMLAnchorElement>} aria-disabled={disabled || undefined} role={disabled ? 'link' : undefined} href={disabled ? undefined : href} rel={disabled ? undefined : rel} target={disabled ? undefined : target} onClick={disabled ? undefined : onClick}>
                {children}
            </a>
        );
    }
    return (
        <button {...attrs} ref={ref as React.Ref<HTMLButtonElement>} type="button" aria-disabled={disabled || undefined} disabled={disabled} onClick={onClick}>
            {children}
        </button>
    );
}
