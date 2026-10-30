<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/popover/constants';
    import type { ArrowProps } from './interface.js';

    let { position = '', arrowStyle, popStyle }: ArrowProps = $props();

    const vertical = $derived(position.startsWith('top') || position.startsWith('bottom'));

    const readStyle = (name: string) => new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`).exec(popStyle ?? '')?.[1]?.trim();

    const borderColor = $derived(arrowStyle?.borderColor ?? readStyle('border-color'));
    const backgroundColor = $derived(arrowStyle?.backgroundColor ?? readStyle('background-color'));
</script>

<svg aria-hidden="true" class={cssClasses.ARROW} height="8" width="24" xmlns="http://www.w3.org/2000/svg">
    {#if vertical}
        <path d="M0 0.5L0 1.5C4 1.5, 5.5 3, 7.5 5S10,8 12,8S14.5 7, 16.5 5S20,1.5 24,1.5L24 0.5L0 0.5z" style:fill={borderColor} style:opacity={arrowStyle?.borderOpacity} />
        <path d="M0 0L0 1C4 1, 5.5 2, 7.5 4S10,7 12,7S14.5  6, 16.5 4S20,1 24,1L24 0L0 0z" style:fill={backgroundColor} />
    {:else}
        <path d="M0.5 0L1.5 0C1.5 4, 3 5.5, 5 7.5S8,10 8,12S7 14.5, 5 16.5S1.5,20 1.5,24L0.5 24L0.5 0z" style:fill={borderColor} style:opacity={arrowStyle?.borderOpacity} />
        <path d="M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z" style:fill={backgroundColor} />
    {/if}
</svg>
