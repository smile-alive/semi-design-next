<script setup lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-vue';
    import { Image, Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const action = 'https://api.semi.design/upload';
    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'music.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-b.svg',
        },
    ];
</script>

<template>
    <Upload accept="image/*" :action="action" :defaultFileList="defaultFileList" listType="picture" multiple>
        <template #thumbnail="{ file }">
            <Image :alt="file.name" :src="file.url" />
        </template>
        <IconPlus aria-label="Upload picture" size="extra-large" />
    </Upload>
</template>
