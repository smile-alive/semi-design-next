<script lang="ts">
    import type { TooltipProps } from '../interface';
    import Tooltip from '../tooltip.svelte';

    let { store, props = {} }: { store: { log: string[] }; props?: Omit<TooltipProps, 'visible' | 'children' | 'child' | 'content' | 'arrow'> } = $props();
</script>

{#snippet content()}
    <button type="button" onclick={() => store.log.push('content click')} onfocusin={() => store.log.push('content focusin')} onfocusout={() => store.log.push('content focusout')} onmousedown={() => store.log.push('content mousedown')}>act</button>
{/snippet}

<Tooltip {content} motion={false} trigger="custom" visible {...props}>trigger</Tooltip>
