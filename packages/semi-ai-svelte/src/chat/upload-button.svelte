<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconChainStroked } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import type { TooltipTriggerProps } from '@fibrae/semi-ui-svelte/tooltip/interface';

    // Upload's add area yields its aria-disabled to a control inside it, so the button carries the state itself. The
    // tooltip's trigger props, when there is one, land on the button, which is the one Tab stop.
    let { disabled, triggerProps }: { disabled: boolean; triggerProps?: TooltipTriggerProps } = $props();

    const locale = useLocale('Chat');
</script>

<Button {...triggerProps} aria-label={locale().locale.upload} class="{cssClasses.PREFIX_INPUT_BOX}-uploadButton" {disabled} theme="borderless">
    {#snippet icon()}
        <IconChainStroked size="extra-large" />
    {/snippet}
</Button>
