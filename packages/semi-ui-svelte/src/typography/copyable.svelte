<script lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
    import { IconCopy, IconTick } from '@fibrae/semi-icons-svelte';
    import useCopied from '../_base/use-copied.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import Tooltip from '../tooltip/tooltip.svelte';
    import type { TypographyCopySnippets } from './interface.js';

    interface Props extends TypographyCopySnippets {
        content: string;
        duration: number;
        class?: ClassValue;
        style?: string;
        onCopy?: (event: MouseEvent, content: string, success: boolean) => void;
        /** The copy action swapped to or from the copied tip, whose width differs, so the text beside it is measured again */
        onCopiedChange?: () => void;
    }

    let { content, duration, class: className, style, onCopy, onCopiedChange, copyIcon, copyTip, copySuccessTip, copyAction }: Props = $props();

    const locale = useLocale('Typography');

    let wrapper = $state.raw<HTMLSpanElement>();
    let button = $state<HTMLButtonElement>();
    let iconLabel = $state<string>();
    let copiedLabel = $state<string>();
    let first = true;

    const copier = useCopied(() => duration * 1000);

    const prefix = cssClasses.PREFIX;

    const copy = (event: MouseEvent) => {
        void copier.copy(content).then((success) => onCopy?.(event, content, success));
    };

    // One button for both states keeps keyboard focus on it across the swap; while copied it does nothing.
    const handleClick = (event: MouseEvent) => {
        if (!copier.copied) copy(event);
    };

    // Block anchors and template whitespace are not content
    const loneElement = (node: HTMLElement) => {
        const nodes = [...node.childNodes].filter((child) => child.nodeType !== Node.COMMENT_NODE && !(child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()));
        return nodes.length === 1 && nodes[0] instanceof Element ? nodes[0] : undefined;
    };

    // A snippet shows nothing to read before it renders: a lone element in the button names it by its aria-label, and
    // an icon without text by the locale text; text names the button by itself.
    $effect(() => {
        // The button content follows `copied`; the effect runs after the DOM shows it
        const copied = copier.copied;
        if (!button) return;
        const only = loneElement(button);
        iconLabel = copyIcon && !copied ? (only?.getAttribute('aria-label') ?? undefined) : undefined;
        copiedLabel = copied && copySuccessTip && only ? (only.getAttribute('aria-label') ?? (only.textContent?.trim() ? undefined : locale().locale.copied)) : undefined;
    });

    $effect(() => {
        void copier.copied;
        if (first) {
            first = false;
            return;
        }
        onCopiedChange?.();
    });

    export function element() {
        return wrapper ?? null;
    }
</script>

{#if copyAction}
    <span bind:this={wrapper}>{@render copyAction({ copied: copier.copied, copy, config: { content, duration, class: className, style } })}</span>
{:else}
    <span bind:this={wrapper} class={[className, copier.copied ? `${prefix}-action-copied` : `${prefix}-action-copy`]} {style}>
        <Tooltip condition={!copier.copied}>
            {#snippet child({ props })}
                <!-- a button is already focusable, so the tooltip's tabindex stays off -->
                <button bind:this={button} {...props} aria-label={copier.copied ? copiedLabel : (iconLabel ?? locale().locale.copy)} class={[`${prefix}-action-btn`, { [`${prefix}-action-copy-icon`]: !copier.copied && !copyIcon }]} tabindex={undefined} type="button" onclick={handleClick}>
                    {#if copier.copied}
                        {#if copySuccessTip}
                            {@render copySuccessTip()}
                        {:else}
                            <span><IconTick />{locale().locale.copied}</span>
                        {/if}
                    {:else if copyIcon}
                        {@render copyIcon()}
                    {:else}
                        <IconCopy />
                    {/if}
                </button>
            {/snippet}
            {#snippet content()}
                {#if copyTip}
                    {@render copyTip()}
                {:else}
                    {locale().locale.copy}
                {/if}
            {/snippet}
        </Tooltip>
    </span>
{/if}
