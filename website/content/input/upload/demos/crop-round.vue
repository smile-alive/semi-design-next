<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<template>
    <Upload
        action="/upload"
        :crop="{
            aspectRatio: 1,
            shape: 'round',
            quality: 0.9,
            modalTitle: '裁切头像',
        }"
        :customRequest="mockUpload"
        @success="(response, file) => console.log('上传成功:', response, file)"
    >
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（圆形裁切）
        </Button>
    </Upload>
</template>
