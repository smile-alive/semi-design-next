<script lang="ts">
    import { ConfigProvider } from '..';
    import { Modal } from '../../modal';
    import Tooltip from '../../tooltip/tooltip.svelte';

    let { mode }: { mode: 'rtl' | 'nested' } = $props();
</script>

{#snippet popups(name: string)}
    <Tooltip trigger="custom" visible>
        {#snippet content()}tip-{name}{/snippet}
        <span>{name}</span>
    </Tooltip>
    <Modal mask={false} motion={false} title={`modal-${name}`} visible />
{/snippet}

{#if mode === 'rtl'}
    <ConfigProvider direction="rtl">{@render popups('rtl')}</ConfigProvider>
{:else}
    <ConfigProvider direction="rtl">
        {@render popups('outer')}
        <ConfigProvider direction="ltr">{@render popups('inner')}</ConfigProvider>
    </ConfigProvider>
{/if}
