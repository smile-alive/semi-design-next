<script lang="ts">
    import { onMount } from 'svelte';
    import type { Breakpoint, OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
    import { getConfigContext } from '../context';

    let { args }: { args: [OnBreakpointScreensCallback] | [Breakpoint[], OnBreakpointChangeCallback] } = $props();

    const config = getConfigContext();

    // subscribes once on mount with the arguments it was created with
    onMount(() => {
        const subscribe = config.onBreakpoint;
        return args.length === 1 ? subscribe?.(args[0]) : subscribe?.(args[0], args[1]);
    });
</script>
