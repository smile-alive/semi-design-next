<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';

    const action = 'https://api.semi.design/upload';
    // A data function is evaluated per upload, so time is the upload moment
    const data = () => ({
        role: 'ies',
        time: new Date().getTime(),
    });
    const headers = {
        'x-tt-semi': 'semi-upload',
    };
</script>

<template>
    <Upload :action="action" :data="data" :headers="headers">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
