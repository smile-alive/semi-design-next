<script setup lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-vue';
    import { Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const url = '/assets/placeholder/avatar-b.svg';
    const defaultFileList: FileItem[] = [
        { uid: '1', name: 'music.png', status: 'success', size: '130KB', preview: true, url },
        { uid: '2', name: 'brand.png', status: 'success', size: '130KB', preview: true, url },
    ];
</script>

<template>
    <Upload accept="image/*" action="https://api.semi.design/upload" :defaultFileList="defaultFileList" listType="picture" multiple showPicInfo>
        <IconPlus aria-label="上传图片" size="extra-large" />
    </Upload>
</template>
