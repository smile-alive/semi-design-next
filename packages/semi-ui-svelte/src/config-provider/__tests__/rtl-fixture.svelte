<script lang="ts">
    import { ConfigProvider } from '..';
    import Switch from '../../switch/switch.svelte';

    let { mode }: { mode: 'nested' | 'page' } = $props();
</script>

{#snippet inner()}
    <Switch aria-label="inner" />
{/snippet}

{#if mode === 'nested'}
    <ConfigProvider direction="rtl">
        <Switch aria-label="outer" />
        <ConfigProvider direction="ltr">{@render inner()}</ConfigProvider>
    </ConfigProvider>
{:else}
    <div dir="rtl">
        <ConfigProvider direction="ltr">{@render inner()}</ConfigProvider>
    </div>
{/if}
