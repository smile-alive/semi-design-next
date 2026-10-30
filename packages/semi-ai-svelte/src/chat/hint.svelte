<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconArrowRight } from '@fibrae/semi-icons-svelte';
    import type { ChatProps } from './interface.js';

    let { hints, class: className, style, hintBox, onHintClick }: { hints: string[]; class?: string; style?: string; hintBox?: ChatProps['hintBox']; onHintClick: (hint: string) => void } = $props();

    const { PREFIX_HINT } = cssClasses;
</script>

<section class={[`${PREFIX_HINT}s`, className]} {style}>
    {#each hints as item, index (index)}
        {#if hintBox}
            {@render hintBox({ content: item, index, onHintClick: () => onHintClick(item) })}
        {:else}
            <button class="{PREFIX_HINT}-item" type="button" onclick={() => onHintClick(item)}>
                <span class="{PREFIX_HINT}-content">{item}</span>
                <IconArrowRight class="{PREFIX_HINT}-icon" />
            </button>
        {/if}
    {/each}
</section>
