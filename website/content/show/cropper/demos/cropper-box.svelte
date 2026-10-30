<script lang="ts">
    import { Button, Cropper } from '@fibrae/semi-ui-svelte';

    const containerStyle = 'width: 550px; height: 300px; margin: 20px';

    let cropper = $state<ReturnType<typeof Cropper>>();
    let cropperUrl = $state('');

    const onButtonClick = () => {
        const canvas = cropper?.getCropperCanvas();
        if (canvas) cropperUrl = canvas.toDataURL();
    };
</script>

<strong>showResizeBox = false，并修改边框颜色</strong>
<Cropper bind:this={cropper} cropperBoxStyle="outline-color: var(--semi-color-bg-0)" showResizeBox={false} src="/assets/other/image.png" style={containerStyle} />
<Button onclick={onButtonClick}>裁切</Button>
<br />
<br />
{#if cropperUrl}
    <img alt="裁切结果" src={cropperUrl} style="height: 400px" />
{/if}
