<script lang="ts">
    import { Slider } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <div>
        <div id="slider-handle-dot-default">Default</div>
        <Slider aria-labelledby="slider-handle-dot-default" handleDot={{ size: '4px', color: 'blue' }} showBoundary />
    </div>
    <br />
    <br />
    <div>
        <div id="slider-handle-dot-range">Range</div>
        <Slider
            aria-labelledby="slider-handle-dot-range"
            handleDot={[
                { size: '4px', color: 'blue' },
                { size: '4px', color: 'pink' },
            ]}
            range
            value={[20, 60]}
        />
    </div>
</div>
