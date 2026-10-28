<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type UploadCustomRequestArgs } from '@fibrae/semi-ui-vue';

    const mockRequest = ({ onProgress, onSuccess }: UploadCustomRequestArgs) => {
        let count = 0;
        const interval = setInterval(() => {
            if (count === 100) {
                clearInterval(interval);
                onSuccess({});
                return;
            }
            onProgress({ total: 100, loaded: count });
            count += 20;
        }, 500);
    };
</script>

<template>
    <Upload action="https://api.semi.design/upload" :customRequest="mockRequest">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
