<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { cssClasses } from '@fibrae/semi-foundation/pagination/constants';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import { type SlotKind, getSlotKind } from '../_base/slot-kind.js';

    interface StepButtonProps {
        kind: 'prev' | 'next';
        /** The locale name, kept unless the content is a lone text */
        label: string;
        disabled: boolean;
        text?: string | Snippet;
        onclick: () => void;
    }

    let { kind, label, disabled, text, onclick }: StepButtonProps = $props();

    let contentKind = $state<SlotKind>();

    const prefix = cssClasses.PREFIX;

    // A string names the button from the first frame; a snippet only after its rendered content is known
    const namedByContent = $derived(typeof text === 'string' ? text !== '' : text !== undefined && contentKind === 'text');

    // A snippet exposes nothing to read before it renders, so a lone text names the button from the second frame on;
    // the server HTML and an icon or element keep the locale name. A text node that changes in place (empty to
    // non-empty) mutates characterData, not childList, so the observer watches both.
    const trackContent: Attachment<HTMLButtonElement> = (button) => {
        const update = () => (contentKind = getSlotKind(button));
        update();
        const observer = new MutationObserver(update);
        observer.observe(button, { childList: true, characterData: true, subtree: true });
        return () => observer.disconnect();
    };
</script>

<button {@attach typeof text === 'function' && trackContent} aria-label={namedByContent ? undefined : label} class={[`${prefix}-item`, `${prefix}-${kind}`, { [`${prefix}-item-disabled`]: disabled }]} {disabled} type="button" x-semi-prop={`${kind}Text`} {onclick}>
    {#if typeof text === 'function'}
        {@render text()}
    {:else if text}
        {text}
    {:else if kind === 'prev'}
        <IconChevronLeft size="large" />
    {:else}
        <IconChevronRight size="large" />
    {/if}
</button>
