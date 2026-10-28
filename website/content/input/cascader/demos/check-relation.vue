<script setup lang="ts">
    import { Cascader } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: '亚洲',
            value: 'Asia',
            children: [
                {
                    label: '中国',
                    value: 'China',
                    children: [
                        {
                            label: '北京',
                            value: 'Beijing',
                        },
                        {
                            label: '上海',
                            value: 'Shanghai',
                        },
                    ],
                },
            ],
        },
        {
            label: '北美洲',
            value: 'North America',
        },
    ];
    const defaultValue = [['Asia'], ['Asia', 'China', 'Beijing']];
    const style = { width: '300px' };
</script>

<template>
    <Cascader checkRelation="unRelated" :defaultValue="defaultValue" multiple :style="style" :treeData="treeData" />
</template>
