<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { IconPaperclip } from '@fibrae/semi-icons-svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import useTrigger from '@fibrae/semi-ui-svelte/tooltip/use-trigger.svelte.js';

    // aria-disabled, not disabled: stays focusable so the upload tip reaches the keyboard
    let { disabled }: { disabled: boolean } = $props();

    const locale = useLocale('AIChatInput');

    let root = $state<HTMLButtonElement>();

    // the Tooltip around the button puts the tip's description on the button itself: the wrapper span is not what has focus
    const bindTrigger = useTrigger(
        () => root,
        () => ({ disabled: false, loading: false, block: false, describes: true })
    );

    const prefix = cssClasses.PREFIX;
    const aria = $derived(bindTrigger());
</script>

<!-- Upload's AddArea yields its role and tabindex to a control inside it, so this button is the only Tab stop -->
<button aria-describedby={aria?.['aria-describedby']} aria-disabled={disabled ? 'true' : undefined} aria-label={locale().locale.upload} bind:this={root} class={[`${prefix}-footer-action-button`, `${prefix}-footer-action-upload`]} type="button">
    <IconPaperclip />
</button>
