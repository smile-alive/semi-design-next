<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';

    const action = 'https://api.semi.design/upload';
    const imageOnly = 'image/*';
    const videoOnly = 'video/*';
    const fileLimit = '.pdf,.png,.jpeg';
</script>

<template>
    <Upload :accept="imageOnly" :action="action" :style="{ marginBottom: '12px' }">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            上传图片
        </Button>
    </Upload>
    <Upload :accept="videoOnly" :action="action" :style="{ marginBottom: '12px' }">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            上传视频
        </Button>
    </Upload>
    <Upload :accept="fileLimit" :action="action">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            上传 PDF, PNG, JPEG
        </Button>
    </Upload>
</template>
