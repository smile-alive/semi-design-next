<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import type { UploadHandle, UploadProps } from '../../interface';
    import Upload from '../../upload.vue';

    const props = defineProps<{ uploadProps?: Partial<UploadProps>; onReady: (handle: UploadHandle) => void }>();
    const upload = useTemplateRef<UploadHandle>('upload');
    onMounted(() => props.onReady(upload.value as UploadHandle));
</script>

<template>
    <Upload ref="upload" action="https://semi.bytendance.com" v-bind="props.uploadProps" />
</template>
