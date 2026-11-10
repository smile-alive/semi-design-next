<script lang="ts">
    import type { Snippet } from 'svelte';
    import { getPopupLayerContext } from '../../base/index.js';
    import { type AvatarGroupMoreValue, setAvatarGroupMoreContext } from './context.js';

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
