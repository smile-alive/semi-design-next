<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Cropper from '../../cropper.vue';
    import type { CropperHandle, CropperProps } from '../../interface';

    const props = defineProps<{ cropperProps?: CropperProps; onReady: (handle: CropperHandle) => void }>();
    const cropper = useTemplateRef<CropperHandle>('cropper');
    onMounted(() => props.onReady(cropper.value as CropperHandle));
</script>

<template>
    <Cropper ref="cropper" v-bind="props.cropperProps" />
</template>
