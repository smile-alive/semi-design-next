<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import Modal from '../modal.svelte';

    // `config` puts the container on ConfigProvider; `own` adds a getPopupContainer on the dialog that wins over it
    let { visible = true, config = false, own }: { visible?: boolean; config?: boolean; own?: () => HTMLElement } = $props();

    let container = $state.raw<HTMLDivElement | null>(null);
</script>

<div bind:this={container} class="modal-container"></div>
{#if config}
    <ConfigProvider getPopupContainer={() => container as HTMLDivElement}>
        <Modal getPopupContainer={own} motion={false} title="Dialog" {visible} />
    </ConfigProvider>
{:else}
    <Modal getPopupContainer={() => container as HTMLDivElement} motion={false} title="Dialog" {visible} />
{/if}
