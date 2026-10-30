<script lang="ts">
    import { Button, Cropper, Slider } from '@fibrae/semi-ui-svelte';

    const containerStyle = 'width: 550px; height: 300px; margin: 20px';
    const actionStyle = 'margin-top: 20px; display: flex; align-items: center; justify-content: center; width: fit-content';

    let rotate = $state(0);
    let zoom = $state(1);
    let cropperUrl = $state('');
    let cropper = $state<ReturnType<typeof Cropper>>();
    let previewWrapper = $state<HTMLDivElement>();

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

    // a function so the cropper reads the wrapper when it needs it; the element is undefined until it has mounted
    const preview = () => previewWrapper;
</script>

<div>
    <Cropper bind:this={cropper} bind:zoom {preview} {rotate} src="/assets/root-web-sites/abstract.jpg" style={containerStyle} />
    <div style={actionStyle}>
        <span id="cropper-preview-rotate">旋转</span>
        <Slider aria-labelledby="cropper-preview-rotate" max={360} min={-360} onChange={onSliderChange} step={1} style="width: 500px" value={rotate} />
    </div>
    <div style={actionStyle}>
        <span id="cropper-preview-zoom">缩放</span>
        <Slider aria-labelledby="cropper-preview-zoom" max={3} min={0.1} onChange={onZoomSliderChange} step={0.1} style="width: 500px" value={zoom} />
    </div>
    <br />
    <div style="display: flex">
        <div style="width: 50%; flex-grow: 1">
            <strong>实时预览</strong>
            <div bind:this={previewWrapper} style="height: 300px; margin-top: 8px"></div>
        </div>
        <div style="width: 50%; flex-grow: 1; padding-left: 10px">
            <Button onclick={onButtonClick}>裁切</Button>
            <br />
            <br />
            {#if cropperUrl}
                <img alt="裁切结果" src={cropperUrl} style="width: 90%" />
            {/if}
        </div>
    </div>
</div>
