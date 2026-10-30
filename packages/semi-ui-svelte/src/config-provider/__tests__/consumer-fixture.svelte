<script lang="ts">
    import { ConfigConsumer, ConfigProvider } from '..';
    import type { ConfigProviderProps, ContextValue } from '../interface';
    import Probe from './probe.svelte';

    // `props` undefined renders the probe outside any provider
    let { store }: { store: { props?: ConfigProviderProps & Record<string, unknown>; onSeen?: (value: ContextValue) => void } } = $props();
</script>

{#if store.props}
    <ConfigProvider {...store.props}>
        <Probe onSeen={store.onSeen} />
        <ConfigConsumer {...{ id: 'consumer' }}>
            {#snippet children(config)}
                <span>{config.timeZone ?? '内容'}</span>
            {/snippet}
        </ConfigConsumer>
    </ConfigProvider>
{:else}
    <Probe onSeen={store.onSeen} />
{/if}
