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
    const cropper = useTemplateRef<CropperHandle>('cropper');
    const cropperUrl = ref('');

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
</script>

<template>
    <div id="cropper-container">
        <Cropper ref="cropper" v-model:zoom="zoom" :rotate="rotate" src="/assets/other/image.png" :style="containerStyle" />
        <div :style="actionStyle">
            <span id="cropper-rotate-zoom-rotate">旋转</span>
            <Slider aria-labelledby="cropper-rotate-zoom-rotate" :max="360" :min="-360" :modelValue="rotate" :step="1" :style="{ width: '500px' }" @update:modelValue="onSliderChange" />
        </div>
        <div :style="actionStyle">
            <span id="cropper-rotate-zoom-zoom">缩放</span>
            <Slider aria-labelledby="cropper-rotate-zoom-zoom" :max="3" :min="0.1" :modelValue="zoom" :step="0.1" :style="{ width: '500px' }" @update:modelValue="onZoomSliderChange" />
        </div>
        <br />
        <Button @click="onButtonClick">裁切</Button>
        <br />
        <br />
        <img v-if="cropperUrl" alt="裁切结果" :src="cropperUrl" :style="{ height: '400px' }" />
    </div>
</template>
