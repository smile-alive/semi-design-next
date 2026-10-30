<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { IconFullScreenStroked } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    let { onClick }: { onClick: (event: MouseEvent) => void } = $props();

    const locale = useLocale('Sidebar');
</script>

<Button aria-label={locale().locale.expand} class={`${cssClasses.COLLAPSE}-header-expand-btn`} theme="borderless" type="tertiary" onclick={onClick}>
    {#snippet icon()}
        <IconFullScreenStroked />
    {/snippet}
</Button>
