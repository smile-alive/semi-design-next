<script setup lang="ts">
    import { ref } from 'vue';
    import { TreeSelect } from '@fibrae/semi-ui-vue';

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
    const value = ref<string | undefined>('Shanghai');
</script>

<template>
    <TreeSelect v-model="value" :dropdownStyle="{ maxHeight: '400px', overflow: 'auto' }" placeholder="请选择" style="width: 300px" :treeData="treeData" />
</template>
