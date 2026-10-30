<script lang="ts">
    import { Slider } from '@fibrae/semi-ui-svelte';

    const boxStyle = 'height: 300px; margin-left: 30px; margin-top: 10px; padding-right: 30px; display: inline-block';
    const marks = { 20: '20°C', 40: '40°C' };
</script>

<div>
    <div style={boxStyle}>
        <Slider aria-label="Vertical slider" vertical />
    </div>
    <div style={boxStyle}>
        <Slider aria-label="Reversed vertical slider" vertical verticalReverse />
    </div>
    <div style={boxStyle}>
        <Slider aria-label="Vertical range slider" range value={[20, 60]} vertical />
    </div>
    <div style={boxStyle}>
        <Slider aria-label="Reversed vertical range slider" range value={[20, 60]} vertical verticalReverse />
    </div>
    <div style={boxStyle}>
        <Slider aria-label="Vertical range slider with marks" {marks} range step={10} value={[20, 60]} vertical />
    </div>
    <div style={boxStyle}>
        <Slider aria-label="Reversed vertical range slider with marks" {marks} range step={10} value={[20, 60]} vertical verticalReverse />
    </div>
</div>
