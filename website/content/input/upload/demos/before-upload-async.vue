<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type BeforeUploadObjectResult, type BeforeUploadProps } from '@fibrae/semi-ui-vue';

    let count = 0;

    const beforeUpload = ({ file }: BeforeUploadProps) => {
        return new Promise<BeforeUploadObjectResult>((resolve, reject) => {
            if (count > 1) {
                count += 1;
                resolve({ autoRemove: false, shouldUpload: true });
            } else {
                const result: BeforeUploadObjectResult = {
                    autoRemove: false,
                    fileInstance: file.fileInstance,
                    status: 'validateFail',
                    shouldUpload: false,
                    validateMessage: `第${count + 1}个注定失败`,
                };
                count += 1;
                reject(result);
            }
        });
    };
</script>

<template>
    <Upload action="https://api.semi.design/upload" :beforeUpload="beforeUpload">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（上传前异步校验）
        </Button>
    </Upload>
</template>
