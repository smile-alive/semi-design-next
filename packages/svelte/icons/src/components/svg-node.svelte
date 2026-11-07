<!-- svelte:element only infers the SVG namespace from a static svg parent, which a recursive component does not have -->
<svelte:options namespace="svg" />

<script lang="ts">
    import type { IconNode } from '@fibrae/semi-icons-core';
    import { resolveAttrs } from './resolve-attrs.js';
    import Self from './svg-node.svelte';

    let { node, resolve }: { node: IconNode; resolve: (value: string) => string } = $props();

    const [tag, attrs, children = []] = $derived(node);
</script>

<svelte:element this={tag} {...resolveAttrs(attrs, resolve)}>
    {#each children as child, index (index)}
        <Self node={child} {resolve} />
    {/each}
</svelte:element>
