<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<template>
    <Upload action="/upload" :customRequest="mockUpload">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
