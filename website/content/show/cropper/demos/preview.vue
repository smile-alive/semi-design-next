<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import { Button, Cropper, Slider, type CropperHandle } from '@fibrae/semi-ui-vue';

    const containerStyle = {
        width: '550px',
        height: '300px',
        margin: '20px',
    };

    const actionStyle = {
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content',
    };

    const rotate = ref(0);
    const zoom = ref(1);
    const cropperUrl = ref('');
    const cropper = useTemplateRef<CropperHandle>('cropper');
    const previewWrapper = useTemplateRef<HTMLDivElement>('previewWrapper');

    const onSliderChange = (value: number | number[]) => {
        if (typeof value === 'number') rotate.value = value;
    };

    const onZoomSliderChange = (value: number | number[]) => {
        if (typeof value === 'number') zoom.value = value;
    };

    const onButtonClick = () => {
        const canvas = cropper.value?.getCropperCanvas();
        if (canvas) cropperUrl.value = canvas.toDataURL();
    };

    // a function so the cropper reads the wrapper when it needs it; the ref is null until the wrapper has mounted
    const preview = () => previewWrapper.value;
</script>

<template>
    <div>
        <Cropper ref="cropper" v-model:zoom="zoom" :preview="preview" :rotate="rotate" src="/assets/root-web-sites/abstract.jpg" :style="containerStyle" />
        <div :style="actionStyle">
            <span id="cropper-preview-rotate">旋转</span>
            <Slider aria-labelledby="cropper-preview-rotate" :max="360" :min="-360" :modelValue="rotate" :step="1" :style="{ width: '500px' }" @update:modelValue="onSliderChange" />
        </div>
        <div :style="actionStyle">
            <span id="cropper-preview-zoom">缩放</span>
            <Slider aria-labelledby="cropper-preview-zoom" :max="3" :min="0.1" :modelValue="zoom" :step="0.1" :style="{ width: '500px' }" @update:modelValue="onZoomSliderChange" />
        </div>
        <br />
        <div :style="{ display: 'flex' }">
            <div :style="{ width: '50%', flexGrow: 1 }">
                <strong>实时预览</strong>
                <div ref="previewWrapper" :style="{ height: '300px', marginTop: '8px' }" />
            </div>
            <div :style="{ width: '50%', flexGrow: 1, paddingLeft: '10px' }">
                <Button @click="onButtonClick">裁切</Button>
                <br />
                <br />
                <img v-if="cropperUrl" alt="裁切结果" :src="cropperUrl" :style="{ width: '90%' }" />
            </div>
        </div>
    </div>
</template>
