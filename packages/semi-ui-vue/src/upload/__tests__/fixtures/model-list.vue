<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '../../../button';
    import type { FileItem, UploadProps } from '../../interface';
    import Upload from '../../upload.vue';

    const props = defineProps<{ uploadProps?: Partial<UploadProps> }>();
    const list = ref<FileItem[]>([]);
    const visible = ref(true);
</script>

<template>
    <button type="button" @click="visible = !visible">toggle</button>
    <Upload v-if="visible" v-model:fileList="list" action="https://semi.bytendance.com" v-bind="props.uploadProps">
        <Button>Upload</Button>
    </Upload>
</template>
