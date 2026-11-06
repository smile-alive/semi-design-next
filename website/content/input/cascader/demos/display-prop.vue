<script setup lang="ts">
    import { Cascader, Typography } from '@fibrae/semi-ui-vue';

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
    const defaultValue = ['zhejiang', 'ningbo', 'jiangbei'];
    const style = { width: '300px' };
</script>

<template>
    <Typography.Title :heading="6">单选</Typography.Title>
    <Cascader :defaultValue="defaultValue" displayProp="value" placeholder="回填时显示数据的value值" :style="style" :treeData="treeData" />
    <br />
    <br />
    <Typography.Title :heading="6">多选</Typography.Title>
    <Cascader :defaultValue="defaultValue" displayProp="value" multiple placeholder="回填时显示数据的value值" :style="style" :treeData="treeData" />
</template>
