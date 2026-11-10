<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<template>
    <Upload action="/upload" :customRequest="mockUpload" directory>
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            上传文件夹
        </Button>
    </Upload>
</template>
