<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const action = 'https://api.semi.design/upload';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'document.pdf',
            status: 'success',
            size: '130KB',
        },
        {
            uid: '2',
            name: 'report.xlsx',
            status: 'success',
            size: '222KB',
        },
    ];
</script>

<template>
    <Upload :action="action" :defaultFileList="defaultFileList" style="margin-bottom: 20px">
        <template #fileListTitle>已上传文件</template>
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            自定义标题文字
        </Button>
    </Upload>
    <Upload :action="action" :defaultFileList="defaultFileList">
        <template #fileListTitle>
            <span style="color: var(--semi-color-primary); font-weight: 600">📁 重要文件</span>
        </template>
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            带样式的标题
        </Button>
    </Upload>
</template>
