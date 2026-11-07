<script lang="ts" module>
    import type { SVGAttributes } from 'svelte/elements';

    export interface SvgProps extends Omit<SVGAttributes<SVGSVGElement>, 'fill'> {
        fill?: string | string[];
    }
</script>

<script lang="ts">
    import type { IconData } from '@fibrae/semi-icons-core';
    import { getFillColor, resolveValue } from '@fibrae/semi-icons-core/utils';
    import { resolveAttrs } from './resolve-attrs.js';
    import SvgNode from './svg-node.svelte';

    let { data, fill, ...rest }: SvgProps & { data: IconData } = $props();

    // One id per instance, stable across re-renders and hydration, for the gradients and masks the svg references
    const uid = $props.id();
    const colors = $derived(data.fills ? getFillColor(fill, data.fills) : []);
    const resolve = $derived((value: string) => resolveValue(value, colors, uid));
    // Multi-colour icons keep their own root fill; `fill` colours their paths instead
    const attrs = $derived({ ...resolveAttrs(data.attrs, resolve), ...(!data.fills && fill !== undefined && { fill: String(fill) }) });
</script>

<!-- rest comes last so an illustration can be resized by width and height -->
<svg {...attrs} aria-hidden="true" focusable="false" {...rest}>
    {#each data.children as node, index (index)}
        <SvgNode {node} {resolve} />
    {/each}
</svg>
