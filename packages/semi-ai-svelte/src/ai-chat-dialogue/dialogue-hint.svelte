<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { AIChatDialogueProps } from './interface.js';

    interface DialogueHintProps {
        hints: string[];
        selecting: boolean;
        class?: string;
        style?: string;
        hintBox?: AIChatDialogueProps['hintBox'];
        onHintClick: (hint: string) => void;
    }

    let { hints, selecting, class: className, style, hintBox, onHintClick }: DialogueHintProps = $props();

    const { PREFIX_HINT } = cssClasses;

    const onKeydown = (event: KeyboardEvent, hint: string) => {
        if (event.key === 'Enter' || event.key === ' ') {
            // Space would scroll, and Enter would press the button the hint click moved focus to
            event.preventDefault();
            onHintClick(hint);
        }
    };
</script>

<section class={[`${PREFIX_HINT}s`, { [`${PREFIX_HINT}s-selecting`]: selecting }, className]} {style}>
    {#each hints as item, index (index)}
        {#if hintBox}
            {@render hintBox({ content: item, index, onHintClick: () => onHintClick(item) })}
        {:else}
            <div class="{PREFIX_HINT}-item" role="button" tabindex="0" onclick={() => onHintClick(item)} onkeydown={(event) => onKeydown(event, item)}>
                <div class="{PREFIX_HINT}-content">{item}</div>
            </div>
        {/if}
    {/each}
</section>
