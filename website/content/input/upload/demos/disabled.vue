<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'first.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-a.svg',
        },
        {
            uid: '2',
            name: 'second.png',
            status: 'validateFail',
            size: '222KB',
            preview: true,
            url: '/assets/placeholder/avatar-a.svg',
        },
    ];
</script>

<template>
    <Upload action="https://api.semi.design/upload" :defaultFileList="defaultFileList" disabled>
        <Button disabled theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
