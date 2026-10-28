<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type AfterUploadProps, type AfterUploadResult } from '@fibrae/semi-ui-vue';

    const afterUpload = ({ response }: AfterUploadProps): AfterUploadResult => {
        if (response.status_code === 200) {
            return {
                autoRemove: false,
                status: 'uploadFail',
                validateMessage: '内容不合法',
                name: 'RenameByServer.jpg',
                url: '/assets/root-web-sites/edit-bag.jpeg',
            };
        }
        return {};
    };
</script>

<template>
    <Upload action="https://api.semi.design/upload" :afterUpload="afterUpload">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
