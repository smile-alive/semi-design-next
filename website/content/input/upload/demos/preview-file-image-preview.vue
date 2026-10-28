<script setup lang="ts">
    import { ref } from 'vue';
    import { IconDelete, IconDownload, IconExpand, IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, ImagePreview, Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'dyBag.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
    ];
</script>

<template>
    <Upload action="https://api.semi.design/upload" :defaultFileList="defaultFileList" :itemStyle="{ width: '300px' }">
        <template #fileOperation="{ file, onRemove }">
            <div style="display: flex; column-gap: 8px; padding: 0 8px">
                <Button aria-label="预览" size="small" theme="borderless" type="tertiary" @click="visible = true">
                    <template #icon>
                        <IconExpand />
                    </template>
                </Button>
                <Button aria-label="下载" size="small" theme="borderless" type="tertiary">
                    <template #icon>
                        <IconDownload />
                    </template>
                </Button>
                <Button aria-label="删除" size="small" theme="borderless" type="tertiary" @click="onRemove()">
                    <template #icon>
                        <IconDelete />
                    </template>
                </Button>
                <ImagePreview v-model:visible="visible" :src="file.url" />
            </div>
        </template>
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
