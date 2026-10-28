<script setup lang="ts">
    import { IconChevronDown, IconMinus, IconPlus } from '@fibrae/semi-icons-vue';
    import { Tree } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: '亚洲',
            key: 'yazhou',
            children: [
                {
                    label: '中国',
                    key: 'zhongguo',
                    children: [
                        {
                            label: '北京',
                            key: 'beijing',
                        },
                        {
                            label: '上海',
                            key: 'shanghai',
                        },
                    ],
                },
                {
                    label: '日本',
                    key: 'riben',
                },
            ],
        },
        {
            label: '北美洲',
            key: 'beimeizhou',
        },
    ];
    const style = {
        width: '260px',
        height: '200px',
        border: '1px solid var(--semi-color-border)',
    };
</script>

<template>
    <p>expandIcon 是固定的图标</p>
    <Tree :defaultExpandedKeys="['yazhou']" multiple :style="style" :treeData="treeData">
        <template #expandIcon>
            <IconChevronDown class="testCls" size="small" />
        </template>
    </Tree>
    <br />
    <p>expandIcon 随展开状态变化</p>
    <Tree :defaultExpandedKeys="['yazhou']" multiple :style="style" :treeData="treeData">
        <template #expandIcon="{ expanded, onClick, class: className }">
            <IconMinus v-if="expanded" :class="className" size="small" @click="onClick" />
            <IconPlus v-else :class="className" size="small" @click="onClick" />
        </template>
    </Tree>
</template>
