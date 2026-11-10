<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<template>
    <Upload
        action="/upload"
        :crop="{
            aspectRatio: 16 / 9,
            shape: 'rect',
            quality: 0.8,
            modalTitle: '裁切图片',
            modalOkText: '确认裁切',
            modalCancelText: '取消',
        }"
        :customRequest="mockUpload"
        @success="(response, file) => console.log('上传成功:', response, file)"
    >
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（16:9 裁切）
        </Button>
    </Upload>
</template>
