<script setup lang="ts">
    import { Cascader } from '@fibrae/semi-ui-vue';

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
            ],
        },
    ];
    const defaultValue = ['zhejiang', 'hangzhou', 'xihu'];
    const style = { width: '300px' };
</script>

<template>
    <div>
        <Cascader disabled placeholder="请选择所在地区" :style="style" :treeData="treeData" />
        <br />
        <br />
        <Cascader :defaultValue="defaultValue" disabled filterTreeNode placeholder="请选择所在地区" :style="style" :treeData="treeData" />
    </div>
</template>
