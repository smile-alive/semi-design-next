<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import SideSheet from '../side-sheet.svelte';

    // `config` puts the container on ConfigProvider; `own` adds a getPopupContainer on the sheet that wins over it
    let { visible = true, config = false, own }: { visible?: boolean; config?: boolean; own?: () => HTMLElement } = $props();

    let container = $state.raw<HTMLDivElement | null>(null);
</script>

<div bind:this={container} class="sheet-container"></div>
{#if config}
    <ConfigProvider getPopupContainer={() => container as HTMLDivElement}>
        <SideSheet getPopupContainer={own} motion={false} title="Sheet" {visible} />
    </ConfigProvider>
{:else}
    <SideSheet getPopupContainer={() => container as HTMLDivElement} motion={false} {visible} />
{/if}
