<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import { Button, Cropper, type CropperHandle } from '@fibrae/semi-ui-vue';

    const containerStyle = {
        width: '550px',
        height: '300px',
        margin: '20px',
    };

    const cropper = useTemplateRef<CropperHandle>('cropper');
    const cropperUrl = ref('');

    const onButtonClick = () => {
        const canvas = cropper.value?.getCropperCanvas();
        if (canvas) cropperUrl.value = canvas.toDataURL();
    };
</script>

<template>
    <strong>showResizeBox = false，并修改边框颜色</strong>
    <Cropper ref="cropper" :cropperBoxStyle="{ outlineColor: 'var(--semi-color-bg-0)' }" :showResizeBox="false" src="/assets/other/image.png" :style="containerStyle" />
    <Button @click="onButtonClick">裁切</Button>
    <br />
    <br />
    <img v-if="cropperUrl" alt="裁切结果" :src="cropperUrl" :style="{ height: '400px' }" />
</template>
