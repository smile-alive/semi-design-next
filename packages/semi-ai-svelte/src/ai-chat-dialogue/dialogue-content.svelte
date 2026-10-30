<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { isAwaitingOutput } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-content';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import contentClass from './content-class.js';
    import { getAIChatDialogueContext } from './context.js';
    import DialogueContentBody from './dialogue-content-body.svelte';
    import type { Metadata } from './interface.js';
    import ReferenceWidget from './widgets/content-item/reference.svelte';

    let { message, role }: { message: Message; role?: Metadata } = $props();

    const { view, snippets } = getAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { PREFIX_CONTENT } = cssClasses;
    const loading = $derived(isAwaitingOutput(message));

    // without a messageEdit snippet nothing could render an editor, and the message would show an empty body
    const editing = $derived(Boolean(message.editing) && message.role === strings.ROLE.USER && Boolean(snippets.messageEdit));
</script>

{#snippet defaultContent()}
    {#if message.references?.length && !editing}
        <ReferenceWidget references={message.references} />
    {/if}
    <DialogueContentBody {editing} {message} />
    {#if loading}
        <span class="{PREFIX_CONTENT}-loading">
            <span class="{PREFIX_CONTENT}-loading-item"></span>
            <span class="{PREFIX_CONTENT}-loading-item"></span>
            <span class="{PREFIX_CONTENT}-loading-item"></span>
            <span class="{PREFIX_CONTENT}-loading-text">{locale().locale.loading}</span>
        </span>
    {/if}
{/snippet}

{#if snippets.content}
    {@render snippets.content({ class: contentClass(message, view.mode), defaultContent, message, role })}
{:else}
    <div class={[PREFIX_CONTENT, { [`${PREFIX_CONTENT}-editing`]: editing }]}>
        {@render defaultContent()}
    </div>
{/if}
