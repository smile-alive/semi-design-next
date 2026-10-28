<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'dyBag.jpeg',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
        {
            uid: '2',
            name: 'dyBag2.jpeg',
            status: 'uploadFail',
            size: '222KB',
            preview: true,
            fileInstance: new File([new ArrayBuffer(2048)], 'dyBag2.jpeg', { type: 'image/png' }),
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
    ];
</script>

<template>
    <Upload action="https://api.semi.design/upload" :defaultFileList="defaultFileList">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
