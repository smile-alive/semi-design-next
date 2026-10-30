<script lang="ts">
    import Carousel from '../carousel.svelte';
    import type { ArrowProps } from '../interface';

    let { left = 'default', right = 'default', arrowProps }: { left?: 'default' | 'icon' | 'labelled' | 'nested' | 'text'; right?: 'default' | 'mixed'; arrowProps?: ArrowProps } = $props();
</script>

{#snippet slide({ item }: { item: number })}
    <h3>index{item}</h3>
{/snippet}

{#snippet text()}Back{/snippet}
{#snippet nested()}<span>Back</span>{/snippet}
{#snippet icon()}<i></i>{/snippet}
{#snippet labelled()}<i aria-label="Back"></i>{/snippet}
{#snippet mixed()}Forward <i></i>{/snippet}

<Carousel {arrowProps} autoPlay={false} items={[0, 1, 2]} leftArrow={left === 'text' ? text : left === 'nested' ? nested : left === 'icon' ? icon : left === 'labelled' ? labelled : undefined} rightArrow={right === 'mixed' ? mixed : undefined} {slide} />
