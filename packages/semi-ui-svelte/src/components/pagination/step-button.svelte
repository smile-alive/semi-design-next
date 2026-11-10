<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/components/pagination/constants';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import observeMutations from '../../utils/observe-mutations.js';
    import { type SlotKind, getSlotKind } from '../../utils/slot-kind.js';

    interface StepButtonProps {
        kind: 'prev' | 'next';
        label: string;
        disabled: boolean;
        text?: string | Snippet;
        onclick: () => void;
    }

    let { kind, label, disabled, text, onclick }: StepButtonProps = $props();

    let contentKind = $state<SlotKind>();

    const prefix = cssClasses.PREFIX;
    const namedByContent = $derived(typeof text === 'string' ? text !== '' : text !== undefined && contentKind === 'text');

    // A snippet exposes nothing to read before it renders, so a lone text names the button from the second frame on;
    // the server HTML and an icon or element keep the locale name. A text node that changes in place (empty to
    // non-empty) mutates characterData, not childList, so the observer watches both.
    const trackContent = observeMutations((button: HTMLButtonElement) => (contentKind = getSlotKind(button)), { childList: true, characterData: true, subtree: true });
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
