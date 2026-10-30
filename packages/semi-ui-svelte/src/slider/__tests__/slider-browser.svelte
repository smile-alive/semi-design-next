<script lang="ts">
    import type { SliderProps } from '../interface';
    import Slider from '../slider.svelte';

    type Value = number | number[] | undefined;

    let { store, bound = false, rootStyle = 'width: 800px; margin-left: 20px; margin-top: 40px', count = 1 }: { store: { props: SliderProps; value?: Value }; bound?: boolean; rootStyle?: string; count?: number } = $props();
</script>

<div style={rootStyle}>
    {#if bound}
        <Slider {...store.props} bind:value={store.value} />
    {:else}
        <Slider {...store.props} />
    {/if}
    {#each { length: count - 1 } as _, index (index)}
        <Slider />
    {/each}
</div>
