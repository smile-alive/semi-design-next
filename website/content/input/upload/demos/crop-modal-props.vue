<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';

    const crop = {
        aspectRatio: 1,
        shape: 'rect',
    } as const;

    const cropModalProps = {
        width: 800,
        style: { height: '600px' },
        bodyStyle: { height: '500px', backgroundColor: '#f5f5f5' },
    };
</script>

<template>
    <Upload action="https://api.semi.design/upload" :crop="crop" :cropModalProps="cropModalProps" @success="(response, file) => console.log('上传成功:', response, file)">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            自定义弹窗样式
        </Button>
    </Upload>
</template>
