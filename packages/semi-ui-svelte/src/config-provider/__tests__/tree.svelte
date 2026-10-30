<script lang="ts" module>
    import type { Breakpoint, OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
    import type { ConfigProviderProps, ContextValue } from '../interface';

    export interface TreeStore {
        outer?: ConfigProviderProps;
        inner?: ConfigProviderProps;
        nested?: boolean;
        subscribers?: Array<[OnBreakpointScreensCallback] | [Breakpoint[], OnBreakpointChangeCallback]>;
        onSeen?: (value: ContextValue) => void;
    }
</script>

<script lang="ts">
    import { ConfigProvider } from '..';
    import Probe from './probe.svelte';
    import Subscriber from './subscriber.svelte';

    let { store }: { store: TreeStore } = $props();
</script>

{#snippet body()}
    <Probe onSeen={store.onSeen} />
    {#each store.subscribers ?? [] as args, index (index)}
        <Subscriber {args} />
    {/each}
{/snippet}

<ConfigProvider {...store.outer}>
    {#if store.nested}
        <ConfigProvider {...store.inner}>{@render body()}</ConfigProvider>
    {:else}
        {@render body()}
    {/if}
</ConfigProvider>
