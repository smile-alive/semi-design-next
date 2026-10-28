<script setup lang="ts">
    import { Cascader } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: 'A',
            value: 'A',
            children: [
                {
                    label: 'B',
                    value: 'B',
                    children: [
                        {
                            label: 'C',
                            value: 'C',
                            children: [
                                {
                                    label: 'D',
                                    value: 'D',
                                    children: [
                                        {
                                            label: 'E',
                                            value: 'E',
                                            children: [{ label: 'F', value: 'F' }],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ];
</script>

<template>
    <Cascader dropdownClassName="components-cascader-demo" placeholder="请选择所在地区" :style="{ width: '300px' }" :treeData="treeData" />
</template>
