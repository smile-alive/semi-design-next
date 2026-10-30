<script lang="ts">
    // A link with `href`, else a native button. A link has no native disabled state: a disabled one drops `href` (not
    // followable or focusable) and takes role="link" plus aria-disabled, since an `a` without href has no role.
    import type { Snippet } from 'svelte';
    import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

    interface Props extends Omit<HTMLButtonAttributes, 'children' | 'type'> {
        disabled?: boolean;
        href?: string;
        rel?: string;
        target?: string;
        children?: Snippet;
    }

    let { disabled = false, href, rel, target, onclick, children, ...rest }: Props = $props();

    // the props are typed for the button; the listeners and attributes a link takes are the same ones
    const linkRest = $derived(rest as HTMLAnchorAttributes);

    // Chrome still delivers a click from a child of a disabled button.
    const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLElement }) => {
        if (!disabled) {
            // the consumer's handler is typed for the button, the link renders the same props
            onclick?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
        }
    };
</script>

<!-- explicit attributes follow the spread so a consumer's type, role or aria-disabled cannot undo the semantics -->
{#if href}
    <a {...linkRest} aria-disabled={disabled || undefined} href={disabled ? undefined : href} rel={disabled ? undefined : rel} role={disabled ? 'link' : undefined} target={disabled ? undefined : target} type={undefined} onclick={handleClick}>
        {@render children?.()}
    </a>
{:else}
    <button {...rest} aria-disabled={disabled || undefined} {disabled} type="button" onclick={handleClick}>
        {@render children?.()}
    </button>
{/if}
