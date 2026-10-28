<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import { Button, Cropper, Radio, RadioGroup, type CropperHandle, type CropperShape, type RadioValue } from '@fibrae/semi-ui-vue';

    const containerStyle = {
        width: '550px',
        height: '300px',
        margin: '20px',
    };

    const cropper = useTemplateRef<CropperHandle>('cropper');
    const shape = ref<RadioValue | undefined>('rect');
    const cropperUrl = ref('');

    const onButtonClick = () => {
        const canvas = cropper.value?.getCropperCanvas();
        if (canvas) cropperUrl.value = canvas.toDataURL();
    };
</script>

<template>
    <RadioGroup v-model="shape" aria-label="裁切框形状">
        <Radio value="rect">rect</Radio>
        <Radio value="round">round</Radio>
        <Radio value="roundRect">roundRect</Radio>
    </RadioGroup>
    <Cropper ref="cropper" :shape="shape as CropperShape" src="/assets/other/image.png" :style="containerStyle" />
    <Button @click="onButtonClick">裁切</Button>
    <br />
    <br />
    <img v-if="cropperUrl" alt="裁切结果" :src="cropperUrl" :style="{ height: '400px' }" />
</template>
