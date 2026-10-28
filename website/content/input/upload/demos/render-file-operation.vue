<script setup lang="ts">
    import { IconDelete, IconDownload, IconEyeOpened, IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const action = 'https://api.semi.design/upload';
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
    <Upload :action="action" :defaultFileList="defaultFileList" :itemStyle="{ width: '300px' }">
        <template #fileOperation="{ onRemove }">
            <div style="display: flex; column-gap: 8px; padding: 0 8px">
                <Button aria-label="预览" size="small" theme="borderless" type="tertiary">
                    <template #icon>
                        <IconEyeOpened />
                    </template>
                </Button>
                <Button aria-label="下载" size="small" theme="borderless" type="tertiary">
                    <template #icon>
                        <IconDownload />
                    </template>
                </Button>
                <Button aria-label="删除" size="small" theme="borderless" type="tertiary" @click="onRemove">
                    <template #icon>
                        <IconDelete />
                    </template>
                </Button>
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
