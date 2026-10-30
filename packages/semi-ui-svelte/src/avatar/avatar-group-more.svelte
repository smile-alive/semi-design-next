<script lang="ts">
    import type { Snippet } from 'svelte';
    import { getPopupLayerContext } from '../_base/popup-layer.js';
    import { type AvatarGroupMoreValue, setAvatarGroupMoreContext } from './context.js';

    // setContext covers this component's subtree, so the `more` content gets its own component scope
    let { children, ...value }: Omit<AvatarGroupMoreValue, 'layer'> & { children: Snippet } = $props();

    const layer = getPopupLayerContext();

    setAvatarGroupMoreContext({
        layer,
        get size() {
            return value.size;
        },
        get shape() {
            return value.shape;
        },
        get itemClass() {
            return value.itemClass;
        },
    });
</script>

{@render children()}
