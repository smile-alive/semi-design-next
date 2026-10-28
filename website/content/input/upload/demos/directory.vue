<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Upload action="https://api.semi.design/upload" directory>
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            上传文件夹
        </Button>
    </Upload>
</template>
