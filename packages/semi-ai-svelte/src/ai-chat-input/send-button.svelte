<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { IconArrowUp, IconStop } from '@fibrae/semi-icons-svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    let { generating, canSend, onClick }: { generating: boolean; canSend: boolean; onClick: () => void } = $props();

    const locale = useLocale('AIChatInput');

    const prefix = cssClasses.PREFIX;
</script>

<!-- not disabled: keeps focus, and the foundation already ignores the click -->
<button
    aria-disabled={!generating && !canSend ? 'true' : undefined}
    aria-label={generating ? locale().locale.stop : locale().locale.send}
    class={[
        `${prefix}-footer-action-button`,
        {
            [`${prefix}-footer-action-send`]: !generating,
            [`${prefix}-footer-action-stop`]: generating,
            [`${prefix}-footer-action-send-disabled`]: !generating && !canSend,
        },
    ]}
    type="button"
    onclick={onClick}
>
    {#if generating}
        <IconStop />
    {:else}
        <IconArrowUp />
    {/if}
</button>
