<script setup lang="ts">
    import { ref } from 'vue';
    import { Cascader, type CascaderSimpleValue } from '@fibrae/semi-ui-vue';

    const value = ref<CascaderSimpleValue[]>([]);
    const treeData = [
        {
            label: '浙江省',
            value: 'zhejiang',
            children: [
                {
                    label: '杭州市',
                    value: 'hangzhou',
                    children: [
                        {
                            label: '西湖区',
                            value: 'xihu',
                        },
                        {
                            label: '萧山区',
                            value: 'xiaoshan',
                        },
                        {
                            label: '临安区',
                            value: 'linan',
                        },
                    ],
                },
                {
                    label: '宁波市',
                    value: 'ningbo',
                    children: [
                        {
                            label: '海曙区',
                            value: 'haishu',
                        },
                        {
                            label: '江北区',
                            value: 'jiangbei',
                        },
                    ],
                },
            ],
        },
    ];
    const style = { width: '300px' };
</script>

<template>
    <Cascader v-model="value" placeholder="请选择所在地区" :style="style" :treeData="treeData" />
</template>
