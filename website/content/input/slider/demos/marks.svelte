<script lang="ts">
    import { Slider } from '@fibrae/semi-ui-svelte';

    const stepTenMarks = { 0: '0', 10: '10', 20: '20', 30: '30', 40: '40', 50: '50', 100: '100' };
    const stepTenthMarks = { 0.1: '0.1', 0.2: '0.2', 0.3: '0.3', 0.4: '0.4', 0.5: '0.5' };
    const celsiusMarks = { 20: '20°C', 40: '40°C' };
    const formatCelsius = (value: number) => `${value}°C`;
</script>

<div>
    <div id="slider-marks-step-10">step=10</div>
    <Slider aria-labelledby="slider-marks-step-10" marks={stepTenMarks} range step={10} value={[10, 100]} />
    <br />
    <br />
    <div id="slider-marks-step-01">step=0.1</div>
    <Slider aria-labelledby="slider-marks-step-01" marks={stepTenthMarks} max={1} min={0} range step={0.1} value={[0.1, 0.5]} />
    <br />
    <br />
    <div id="slider-marks-marks">Marks</div>
    <Slider aria-labelledby="slider-marks-marks" getAriaValueText={formatCelsius} marks={celsiusMarks} range tipFormatter={formatCelsius} value={[0, 100]} />
    <br />
    <br />
    <div id="slider-marks-included">Included</div>
    <Slider aria-labelledby="slider-marks-included" getAriaValueText={formatCelsius} included={false} marks={celsiusMarks} range tipFormatter={formatCelsius} value={[0, 100]} />
</div>
