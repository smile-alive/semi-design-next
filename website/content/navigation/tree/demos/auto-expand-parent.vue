<script setup lang="ts">
    import { ref } from 'vue';
    import { Tree } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: '亚洲',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: '中国',
                    value: 'China',
                    key: '0-0',
                    children: [
                        {
                            label: '北京',
                            value: 'Beijing',
                            key: '0-0-0',
                        },
                        {
                            label: '上海',
                            value: 'Shanghai',
                            key: '0-0-1',
                        },
                    ],
                },
            ],
        },
        {
            label: '北美洲',
            value: 'North America',
            key: '1',
        },
    ];
    const style = {
        width: '260px',
        height: '420px',
        border: '1px solid var(--semi-color-border)',
    };
    const expandedKeys = ref(['0', '0-0']);
</script>

<template>
    <div>需要先将“中国”节点收起后，才能够收起“亚洲”节点</div>
    <br />
    <Tree v-model:expandedKeys="expandedKeys" autoExpandParent :style="style" :treeData="treeData" />
</template>
