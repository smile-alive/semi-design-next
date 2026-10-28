<script setup lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-vue';
    import { Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'dy.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-a.svg',
        },
    ];
</script>

<template>
    <Upload accept="image/*" action="https://api.semi.design/upload" :defaultFileList="defaultFileList" listType="picture" multiple>
        <IconPlus aria-label="上传图片" size="extra-large" />
    </Upload>
</template>
