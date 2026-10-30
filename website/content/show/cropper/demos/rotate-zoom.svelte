<script lang="ts">
    import { Button, Cropper, Slider } from '@fibrae/semi-ui-svelte';

    const containerStyle = 'width: 550px; height: 300px; margin: 20px';
    const actionStyle = 'margin-top: 20px; display: flex; align-items: center; justify-content: center; width: fit-content';

    let rotate = $state(0);
    let zoom = $state(1);
    let cropper = $state<ReturnType<typeof Cropper>>();
    let cropperUrl = $state('');

    const onSliderChange = (value: number | number[]) => {
        if (typeof value === 'number') rotate = value;
    };

    const onZoomSliderChange = (value: number | number[]) => {
        if (typeof value === 'number') zoom = value;
    };

    const onButtonClick = () => {
        const canvas = cropper?.getCropperCanvas();
        if (canvas) cropperUrl = canvas.toDataURL();
    };
</script>

<div id="cropper-container">
    <Cropper bind:this={cropper} bind:zoom {rotate} src="/assets/other/image.png" style={containerStyle} />
    <div style={actionStyle}>
        <span id="cropper-rotate-zoom-rotate">旋转</span>
        <Slider aria-labelledby="cropper-rotate-zoom-rotate" max={360} min={-360} onChange={onSliderChange} step={1} style="width: 500px" value={rotate} />
    </div>
    <div style={actionStyle}>
        <span id="cropper-rotate-zoom-zoom">缩放</span>
        <Slider aria-labelledby="cropper-rotate-zoom-zoom" max={3} min={0.1} onChange={onZoomSliderChange} step={0.1} style="width: 500px" value={zoom} />
    </div>
    <br />
    <Button onclick={onButtonClick}>裁切</Button>
    <br />
    <br />
    {#if cropperUrl}
        <img alt="裁切结果" src={cropperUrl} style="height: 400px" />
    {/if}
</div>
