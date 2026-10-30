<script lang="ts">
    import type { Snippet } from 'svelte';
    import { setPopupLayerContext } from './popup-layer.js';

    let { children }: { children?: Snippet } = $props();

    setPopupLayerContext(Symbol('semi-popup-layer'));
</script>

{@render children?.()}
