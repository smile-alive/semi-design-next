<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type BeforeUploadObjectResult, type BeforeUploadProps } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';

    let count = 0;

    const beforeUpload = ({ file }: BeforeUploadProps) => {
        return new Promise<BeforeUploadObjectResult>((resolve, reject) => {
            if (count > 1) {
                const result = {
                    autoRemove: false,
                    shouldUpload: true,
                };
                count = count + 1;
                resolve(result);
            } else {
                const result = {
                    autoRemove: false,
                    fileInstance: file.fileInstance,
                    status: 'validateFail',
                    shouldUpload: false,
                    validateMessage: `第${count + 1}个注定失败`,
                };
                count = count + 1;
                reject(result);
            }
        });
    };
</script>

<template>
    <Upload action="/upload" :beforeUpload="beforeUpload" :customRequest="mockUpload">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（上传前异步校验）
        </Button>
    </Upload>
</template>
