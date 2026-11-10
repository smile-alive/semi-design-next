<script setup lang="ts">
    import { IconFile, IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Image, Upload, type FileItem } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'dyBag.png',
            status: 'success',
            size: '130KB',
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
        {
            uid: '2',
            name: 'dyBag2.png',
            status: 'success',
            size: '130KB',
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
    ];
</script>

<template>
    <Upload action="/upload" :customRequest="mockUpload" :defaultFileList="defaultFileList">
        <template #previewFile="{ file }">
            <IconFile v-if="file.uid === '1'" size="large" />
            <Image v-else alt="" :src="file.url" />
        </template>
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
