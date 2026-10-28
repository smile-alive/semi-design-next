<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { IconPlus, IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';

    const uploadRef = useTemplateRef('uploadRef');
    const action = 'https://api.semi.design/upload';
</script>

<template>
    <div>
        <Upload ref="uploadRef" accept="image/gif, image/png, image/jpeg, image/bmp, image/webp" :action="action" uploadTrigger="custom" @error="(...v) => console.log(...v)" @success="(...v) => console.log(...v)">
            <Button style="margin-inline-end: 8px" theme="light">
                <template #icon>
                    <IconPlus />
                </template>
                选择文件
            </Button>
        </Upload>
        <Button theme="light" @click="uploadRef?.upload()">
            <template #icon>
                <IconUpload />
            </template>
            开始上传
        </Button>
    </div>
</template>
