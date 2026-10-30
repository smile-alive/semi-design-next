<script lang="ts">
    import Slider from '../slider.svelte';

    let { kind }: { kind: 'for' | 'labelledby' | 'disabled-for' } = $props();
</script>

{#if kind === 'labelledby'}
    <span id="price-label">Price</span>
    <Slider aria-labelledby="price-label" range value={[20, 60]} />
{:else}
    <label for="volume">Volume</label>
    <Slider disabled={kind === 'disabled-for'} id="volume" value={30} />
{/if}
