<script lang="ts">
    import { InputNumber, Slider } from '@fibrae/semi-ui-svelte';

    let value = $state(10);

    const getSliderValue = (newValue: number | string | number[]) => {
        if (isNaN(Number(newValue))) {
            return;
        }
        value = Number(newValue);
    };
</script>

<div>
    <div style="width: 320px; margin-right: 15px">
        <Slider aria-label="数值" onChange={getSliderValue} step={1} {value} />
    </div>
    <InputNumber aria-label="数值" max={100} min={0} onChange={getSliderValue} style="width: 100px" {value} />
</div>
