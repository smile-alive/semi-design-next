<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type UploadProps } from '@fibrae/semi-ui-vue';

    const crop = { aspectRatio: 1, shape: 'round' } as const;

    const beforeCrop: UploadProps['beforeCrop'] = (file, fileList) => {
        console.log('beforeCrop:', file, fileList);
        // true continues cropping; false skips it and uploads directly
        return window.confirm('是否裁切图片？');
    };
</script>

<template>
    <Upload action="https://api.semi.design/upload" :beforeCrop="beforeCrop" :crop="crop" @cropError="(error) => console.error('裁切失败:', error)" @success="(response, file) => console.log('上传成功:', response, file)">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（裁切前确认）
        </Button>
    </Upload>
</template>
