<script lang="ts">
    import type { Snippet } from 'svelte';
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { ModalHookApi } from '../interface';
    import HookCaller from './hook-caller.svelte';

    let { onApi, reachable, direction, show = true }: { onApi: (api: ModalHookApi, reachableContent: Snippet) => void; reachable?: string; direction?: 'ltr' | 'rtl'; show?: boolean } = $props();
</script>

<ConfigProvider {direction}>
    {#if show}
        <HookCaller {onApi} {reachable} />
    {/if}
</ConfigProvider>
