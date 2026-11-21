<script lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
    import { IconFullScreenStroked } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    let { onClick, class: className, style }: { onClick: (event: MouseEvent) => void; class?: ClassValue; style?: string } = $props();

    const locale = useLocale('Sidebar');
</script>

<Button aria-label={locale().locale.expand} class={[`${cssClasses.COLLAPSE}-header-expand-btn`, className]} {style} theme="borderless" type="tertiary" onclick={onClick}>
    {#snippet icon()}
        <IconFullScreenStroked />
    {/snippet}
</Button>
