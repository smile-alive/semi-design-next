<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Tree, type TreeProps } from '@fibrae/semi-ui-vue';

    const json = {
        Node1: {
            'Child Node1': '0-0-1',
            'Child Node2': '0-0-2',
        },
        Node2: '0-1',
    };
    const json2 = {
        Node3: {
            'Child Node1': '0-0-1',
            'Child Node2': '0-0-2',
            'Child Node3': '0-0-3',
            'Child Node4': '0-0-4',
        },
        Node2: '0-1',
    };
    const style = {
        marginRight: '20px',
        width: '260px',
        height: '420px',
        border: '1px solid var(--semi-color-border)',
    };
    const tree = ref<TreeProps['treeDataSimpleJson']>(json);
</script>

<template>
    <Button :style="{ marginBottom: '10px' }" @click="tree = json2">点击更新 TreeData</Button>
    <div :style="{ display: 'flex' }">
        <div>
            <span>defaultExpandAll</span>
            <Tree defaultExpandAll :style="style" :treeDataSimpleJson="tree" />
        </div>
        <div>
            <span>expandAll</span>
            <Tree expandAll :style="style" :treeDataSimpleJson="tree" />
        </div>
    </div>
</template>
