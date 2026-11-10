<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';

    const action = '/upload';
    const imageOnly = 'image/*';
    const videoOnly = 'video/*';
    const fileLimit = '.pdf,.png,.jpeg';
</script>

<template>
    <Upload :accept="imageOnly" :action="action" :customRequest="mockUpload" :style="{ marginBottom: '12px' }">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            上传图片
        </Button>
    </Upload>
    <Upload :accept="videoOnly" :action="action" :customRequest="mockUpload" :style="{ marginBottom: '12px' }">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            上传视频
        </Button>
    </Upload>
    <Upload :accept="fileLimit" :action="action" :customRequest="mockUpload">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            上传 PDF, PNG, JPEG
        </Button>
    </Upload>
</template>
