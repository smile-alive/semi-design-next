<script lang="ts">
    import { Button, Cropper, Radio, RadioGroup, type CropperShape, type RadioValue } from '@fibrae/semi-ui-svelte';

    const containerStyle = 'width: 550px; height: 300px; margin: 20px';

    let cropper = $state<ReturnType<typeof Cropper>>();
    let shape = $state<RadioValue | undefined>('rect');
    let cropperUrl = $state('');

    const onButtonClick = () => {
        const canvas = cropper?.getCropperCanvas();
        if (canvas) cropperUrl = canvas.toDataURL();
    };
</script>

<RadioGroup aria-label="裁切框形状" bind:value={shape} name="demo-cropper-shape">
    <Radio value="rect">rect</Radio>
    <Radio value="round">round</Radio>
    <Radio value="roundRect">roundRect</Radio>
</RadioGroup>
<Cropper bind:this={cropper} shape={shape as CropperShape} src="/assets/other/image.png" style={containerStyle} />
<Button onclick={onButtonClick}>裁切</Button>
<br />
<br />
{#if cropperUrl}
    <img alt="裁切结果" src={cropperUrl} style="height: 400px" />
{/if}
