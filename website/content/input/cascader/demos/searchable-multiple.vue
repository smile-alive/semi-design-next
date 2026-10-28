<script setup lang="ts">
    import { ref } from 'vue';
    import { Cascader, type CascaderValue } from '@fibrae/semi-ui-vue';

    const value = ref<CascaderValue>(['zhejiang', 'ningbo', 'haishu']);

    const treeData = [
        {
            label: '浙江省',
            value: 'zhejiang',
            children: [
                {
                    label: '杭州市',
                    value: 'hangzhou',
                    children: [
                        { label: '西湖区', value: 'xihu' },
                        { label: '萧山区', value: 'xiaoshan' },
                        { label: '临安区', value: 'linan' },
                    ],
                },
                {
                    label: '宁波市',
                    value: 'ningbo',
                    children: [
                        { label: '海曙区', value: 'haishu' },
                        { label: '江北区', value: 'jiangbei' },
                    ],
                },
            ],
        },
    ];
</script>

<template>
    <Cascader v-model="value" filterTreeNode multiple placeholder="请选择所在地区" style="width: 300px" :treeData="treeData" />
</template>
