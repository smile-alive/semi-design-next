<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { getAIChatDialogueContext } from './context.js';
    import type { Metadata } from './interface.js';

    let { message, role }: { message: Message; role?: Metadata } = $props();

    const { snippets } = getAIChatDialogueContext();
</script>

{#snippet defaultTitle()}
    <span class="{cssClasses.PREFIX}-title">{role?.name}</span>
{/snippet}

{#if snippets.title}
    {@render snippets.title({ defaultTitle, message, role })}
{:else}
    {@render defaultTitle()}
{/if}
