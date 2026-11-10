<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Toast, Upload, type CustomFile } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';

    // Declared here, not inline: vue-tsc types an import used inside a template arrow function as a ref (`Toast.value`)
    const onSizeError = (file: CustomFile) => Toast.error(`${file.name} size invalid`);
</script>

<template>
    <Upload action="/upload" :customRequest="mockUpload" :maxSize="1024" :minSize="200" @sizeError="onSizeError">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（最小 200KB，最大 1MB）
        </Button>
    </Upload>
</template>
