<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type UploadCropProps } from '@fibrae/semi-ui-vue';

    const crop: UploadCropProps = {
        aspectRatio: 16 / 9,
        shape: 'rect',
        quality: 0.8,
        modalTitle: '裁切图片',
        modalOkText: '确认裁切',
        modalCancelText: '取消',
    };
</script>

<template>
    <Upload action="https://api.semi.design/upload" :crop="crop" @success="(response, file) => console.log('上传成功:', response, file)">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（16:9 裁切）
        </Button>
    </Upload>
</template>
