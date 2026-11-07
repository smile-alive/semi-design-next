<script lang="ts">
    import { onMount } from 'svelte';
    import type { Breakpoint, OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/components/config-provider/responsive-types';
    import { getConfigContext } from '../context';

    let { args }: { args: [OnBreakpointScreensCallback] | [Breakpoint[], OnBreakpointChangeCallback] } = $props();

    const config = getConfigContext();

    onMount(() => {
        const subscribe = config.onBreakpoint;
        return args.length === 1 ? subscribe?.(args[0]) : subscribe?.(args[0], args[1]);
    });
</script>
