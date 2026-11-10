<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<template>
    <Upload action="/upload" crop :customRequest="mockUpload" @success="(response, file) => console.log('上传成功:', response, file)">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（启用裁切）
        </Button>
    </Upload>
</template>
