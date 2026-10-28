<script setup lang="ts">
    import { ref } from 'vue';
    import { Transfer, Button } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: '文件夹 1',
            value: 'folder1',
            key: 'folder1',
            children: [
                { label: '文件 1-1', value: 'file1-1', key: 'file1-1' },
                { label: '文件 1-2', value: 'file1-2', key: 'file1-2' },
                {
                    label: '子文件夹 1',
                    value: 'subfolder1',
                    key: 'subfolder1',
                    children: [
                        { label: '文件 1-1-1', value: 'file1-1-1', key: 'file1-1-1' },
                        { label: '文件 1-1-2', value: 'file1-1-2', key: 'file1-1-2' },
                    ],
                },
            ],
        },
        {
            label: '文件夹 2',
            value: 'folder2',
            key: 'folder2',
            children: [
                { label: '文件 2-1', value: 'file2-1', key: 'file2-1' },
                { label: '文件 2-2', value: 'file2-2', key: 'file2-2' },
            ],
        },
        { label: '独立文件', value: 'file3', key: 'file3' },
    ];

    const value = ref<Array<string | number>>([]);
</script>

<template>
    <Transfer v-model="value" :dataSource="treeData" style="width: 600px" type="treeList">
        <template #sourceHeader="{ num, leafOnlyNum, showButton, allChecked, onAllClick }">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--semi-color-border)">
                <span>
                    <strong>文件总数：</strong>
                    {{ leafOnlyNum !== undefined ? leafOnlyNum : num }} 个文件
                    <span v-if="leafOnlyNum !== undefined" style="color: var(--semi-color-text-2); margin-inline-start: 8px; font-size: 12px"> （总节点数：{{ num }}） </span>
                </span>
                <Button v-if="showButton" size="small" theme="borderless" type="tertiary" @click="onAllClick">
                    {{ allChecked ? '取消全选' : '全选' }}
                </Button>
            </div>
        </template>
    </Transfer>
</template>
