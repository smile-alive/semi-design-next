<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type BeforeUploadObjectResult, type BeforeUploadProps } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';

    let count = 0;

    const transformFile = (fileInstance: File) => {
        if (count === 0) {
            return new File([fileInstance], 'newFileName', { type: 'image/png' });
        }
        return fileInstance;
    };

    const beforeUpload = ({ file }: BeforeUploadProps) => {
        let result: BeforeUploadObjectResult;
        if (count > 0) {
            result = {
                autoRemove: false,
                fileInstance: file.fileInstance,
                shouldUpload: true,
            };
        } else {
            result = {
                autoRemove: false,
                fileInstance: file.fileInstance,
                status: 'validateFail',
                shouldUpload: false,
            };
        }
        count = count + 1;
        return result;
    };
</script>

<template>
    <Upload action="/upload" :beforeUpload="beforeUpload" :customRequest="mockUpload" :transformFile="transformFile">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（上传前同步校验）
        </Button>
    </Upload>
</template>
