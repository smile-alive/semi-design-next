<script lang="ts">
    import Rating from '../rating.svelte';

    let { tooltips, onChange }: { tooltips?: string[]; onChange?: (value: number) => void } = $props();

    let value = $state(0);
    const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
</script>

<div>
    <span>
        How was the help you received:
        {#if value}<span id="rating-result">{desc[value - 1]}</span>{/if}
    </span>
    <Rating bind:value {onChange} {tooltips} />
    <output aria-label="value">{value}</output>
</div>
