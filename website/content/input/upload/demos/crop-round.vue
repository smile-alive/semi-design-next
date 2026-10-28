<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload } from '@fibrae/semi-ui-vue';

    const crop = {
        aspectRatio: 1,
        shape: 'round',
        quality: 0.9,
        modalTitle: '裁切头像',
    } as const;
</script>

<template>
    <Upload action="https://api.semi.design/upload" :crop="crop" @success="(response, file) => console.log('上传成功:', response, file)">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（圆形裁切）
        </Button>
    </Upload>
</template>
