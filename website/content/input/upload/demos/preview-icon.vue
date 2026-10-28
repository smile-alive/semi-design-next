<script setup lang="ts">
    import { IconEyeOpened, IconPlus } from '@fibrae/semi-icons-vue';
    import { Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'resso.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-b.svg',
        },
    ];

    const handlePreview = (file: FileItem) => {
        window.open(file.url, 'imagePreview', 'width=300,height=300');
    };
</script>

<template>
    <Upload accept="image/*" action="https://api.semi.design/upload" :defaultFileList="defaultFileList" listType="picture" multiple showPicInfo @previewClick="handlePreview">
        <template #picPreviewIcon>
            <IconEyeOpened style="color: var(--semi-color-white); font-size: 24px" />
        </template>
        <IconPlus aria-label="上传图片" size="extra-large" />
    </Upload>
</template>
