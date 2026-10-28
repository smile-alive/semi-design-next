<script setup lang="ts">
    import { IconClose, IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-vue';

    const action = 'https://api.semi.design/upload';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'document.pdf',
            status: 'success',
            size: '130KB',
        },
        {
            uid: '2',
            name: 'report.xlsx',
            status: 'success',
            size: '222KB',
        },
    ];
</script>

<template>
    <Upload :action="action" :defaultFileList="defaultFileList" style="margin-bottom: 20px">
        <template #fileListHeader="{ fileList, onClear, clearText }">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
                <span style="color: var(--semi-color-primary)">📂 共 {{ fileList.length }} 个文件</span>
                <Button size="small" type="danger" @click="onClear">
                    <template #icon>
                        <IconClose />
                    </template>
                    {{ clearText }}
                </Button>
            </div>
        </template>
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            自定义清空按钮样式
        </Button>
    </Upload>
    <Upload :action="action" :defaultFileList="defaultFileList">
        <template #fileListHeader="{ fileList, onClear }">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
                <span>
                    已选择
                    <strong style="color: var(--semi-color-danger)">{{ fileList.length }}</strong>
                    个文件
                </span>
                <button style="padding: 0; border: none; background: none; font: inherit; cursor: pointer; color: var(--semi-color-link); font-size: 12px" type="button" @click="onClear">全部移除</button>
            </div>
        </template>
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            完全自定义标题区域
        </Button>
    </Upload>
</template>
