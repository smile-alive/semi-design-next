<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconDeleteStroked } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    let { onClick }: { onClick: () => void } = $props();

    const locale = useLocale('Chat');
</script>

<Button aria-label={locale().locale.clear} class="{cssClasses.PREFIX_INPUT_BOX}-clearButton" theme="borderless" onclick={onClick}>
    {#snippet icon()}
        <IconDeleteStroked />
    {/snippet}
</Button>
