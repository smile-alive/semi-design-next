import { Show, splitProps, untrack, type JSX } from 'solid-js';
import callHandler from '../_base/call-handler';
import mergeRefs from '../_base/merge-refs';
import type { FloatButtonElement, FloatButtonProps } from './interface';

export interface ActionProps extends Omit<FloatButtonProps, 'icon' | 'shape' | 'size' | 'colorful' | 'badge'> {
    children?: JSX.Element;
}

/**
 * A link when `href` is set, otherwise a native button. A link has no native disabled state: a disabled one drops
 * `href` so it cannot be followed or focused, and takes `role="link"` with `aria-disabled` so screen readers still
 * announce it.
 */
export default function Action(props: ActionProps) {
    const [local, rest] = splitProps(props, ['href', 'target', 'rel', 'disabled', 'onClick', 'children', 'ref']);

    // Chrome still delivers a click from a child of a disabled button
    const handleClick = (event: MouseEvent & { currentTarget: FloatButtonElement; target: Element }) => {
        if (!local.disabled) {
            callHandler(local.onClick, event);
        }
    };

    // Show's memo tracks a ref read in its branches; a spread props signal would recreate the element and drop focus
    return (
        <Show
            when={local.href}
            fallback={
                <button {...rest} ref={untrack(() => mergeRefs<FloatButtonElement>(local.ref))} type="button" aria-disabled={local.disabled || undefined} disabled={local.disabled} onClick={handleClick}>
                    {local.children}
                </button>
            }
        >
            {(href) => (
                // The props are typed for the button that FloatButtonProps describes; with href the same handlers get the link
                <a
                    {...(rest as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}
                    ref={untrack(() => mergeRefs<FloatButtonElement>(local.ref))}
                    aria-disabled={local.disabled || undefined}
                    role={local.disabled ? 'link' : undefined}
                    href={local.disabled ? undefined : href()}
                    rel={local.disabled ? undefined : local.rel}
                    target={local.disabled ? undefined : local.target}
                    onClick={handleClick}
                >
                    {local.children}
                </a>
            )}
        </Show>
    );
}
