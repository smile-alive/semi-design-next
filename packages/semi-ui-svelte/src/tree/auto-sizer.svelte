<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';

    interface AutoSizerProps {
        defaultHeight: number | string;
        defaultWidth?: number | string;
        children: Snippet<[{ height: number; width: number | string }]>;
    }

    /** Passes a pixel height to its snippet: `defaultHeight` when it is a number, else the parent's content height */
    let { defaultHeight, defaultWidth = '100%', children }: AutoSizerProps = $props();

    let wrapper = $state<HTMLDivElement>();
    let measured = $state<number>();

    const height = $derived(measured ?? defaultHeight);

    $effect(() => {
        const parent = wrapper?.parentElement;
        if (!parent) {
            return;
        }
        const observer = new ResizeObserver(() => {
            const style = window.getComputedStyle(parent);
            const paddings = (Number.parseInt(style.paddingTop, 10) || 0) + (Number.parseInt(style.paddingBottom, 10) || 0);
            measured = (parent.offsetHeight || 0) - paddings;
        });
        observer.observe(parent);
        return () => observer.disconnect();
    });
</script>

<div bind:this={wrapper} class="{cssClasses.PREFIX}-auto-wrapper" style="height: {toCssLength(defaultHeight)}; overflow: visible">
    {#if typeof height === 'number' && height !== 0}
        {@render children({ height, width: defaultWidth })}
    {/if}
</div>
