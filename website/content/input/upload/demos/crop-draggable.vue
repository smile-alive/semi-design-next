<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';

    const crop = {
        aspectRatio: 1,
        shape: 'rect',
    } as const;
</script>

<template>
    <Upload action="https://api.semi.design/upload" :crop="crop" draggable @drop="(_e, files) => console.log('拖拽文件:', files)" @success="(response, file) => console.log('上传成功:', response, file)">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            拖拽上传（启用裁切）
        </Button>
    </Upload>
</template>
