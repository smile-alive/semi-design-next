<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconArrowUp } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    let { disabled, onClick }: { disabled: boolean; onClick: (event: MouseEvent) => void } = $props();

    const locale = useLocale('Chat');

    const { PREFIX_INPUT_BOX } = cssClasses;
</script>

<Button aria-label={locale().locale.send} class="{PREFIX_INPUT_BOX}-sendButton" {disabled} theme="solid" type="primary" onclick={onClick}>
    {#snippet icon()}
        <IconArrowUp class="{PREFIX_INPUT_BOX}-sendButton-icon" size="large" />
    {/snippet}
</Button>
