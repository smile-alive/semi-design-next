<script lang="ts">
    import { Slider } from '@fibrae/semi-ui-svelte';

    const range = [10, 100];

    const getRailStyle = (value: number[]) => {
        // transparent lets the middle segment show the track color
        const color = ['var(--semi-color-danger)', 'transparent', 'var(--semi-color-success)'];
        const gradientPos = value.map((val) => Number(((val - range[0]) / (range[1] - range[0])).toFixed(2)) * 100);
        return `background: linear-gradient(to right, ${color[0]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[1]}%, ${color[2]} ${gradientPos[1]}%)`;
    };

    let value = $state<number | number[]>([20, 60]);

    const railStyle = $derived(getRailStyle(Array.isArray(value) ? value : [value, value]));
</script>

<Slider aria-label="Value range" bind:value max={range[1]} min={range[0]} {railStyle} range />
