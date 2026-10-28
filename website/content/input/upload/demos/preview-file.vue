<script setup lang="ts">
    import { IconFile, IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Image, Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const url = '/assets/root-web-sites/edit-bag.jpeg';
    const defaultFileList: FileItem[] = [
        { uid: '1', name: 'dyBag.png', status: 'success', size: '130KB', url },
        { uid: '2', name: 'dyBag2.png', status: 'success', size: '130KB', url },
    ];
</script>

<template>
    <Upload action="https://api.semi.design/upload" :defaultFileList="defaultFileList">
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
