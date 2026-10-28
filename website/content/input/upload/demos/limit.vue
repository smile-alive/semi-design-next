<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type UploadOnChangeProps } from '@fibrae/semi-ui-vue';

    const limit = 1;
    const onChange = (props: UploadOnChangeProps) => {
        console.log(props.fileList);
    };
</script>

<template>
    <Upload action="https://api.semi.design/upload" :limit="limit" @change="onChange">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（最多{{ limit }}项）
        </Button>
    </Upload>
</template>
