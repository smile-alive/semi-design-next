<script lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/chat/constants';
    import { IconArrowUp } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    let { disabled, class: className, style, onClick }: { disabled: boolean; class?: ClassValue; style?: string; onClick: (event: MouseEvent) => void } = $props();

    const locale = useLocale('Chat');

    const { PREFIX_INPUT_BOX } = cssClasses;
</script>

<Button aria-label={locale().locale.send} class={[`${PREFIX_INPUT_BOX}-sendButton`, className]} {disabled} {style} theme="solid" type="primary" onclick={onClick}>
    {#snippet icon()}
        <IconArrowUp class="{PREFIX_INPUT_BOX}-sendButton-icon" size="large" />
    {/snippet}
</Button>
