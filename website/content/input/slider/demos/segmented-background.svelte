<script lang="ts">
    import { Slider } from '@fibrae/semi-ui-svelte';

    const range = [10, 100];

    const getRailStyle = (value: number[]) => {
        // transparent lets the middle segment show the track color
        const color = ['var(--semi-color-danger)', 'transparent', 'var(--semi-color-success)'];
        const gradientPos = value.map((val) => Number(((val - range[0]) / (range[1] - range[0])).toFixed(2)) * 100);
        return `background: linear-gradient(to right, ${color[0]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[1]}%, ${color[2]} ${gradientPos[1]}%)`;
    };

    let value = $state([20, 60]);

    const changeValue = (newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            value = newValue;
        }
    };

    const railStyle = $derived(getRailStyle(value));
</script>

<Slider aria-label="Value range" max={range[1]} min={range[0]} onChange={changeValue} range styles={{ rail: railStyle }} {value} />
