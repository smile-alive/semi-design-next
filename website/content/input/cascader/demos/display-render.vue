<script setup lang="ts">
    import { Cascader, Tag, Typography } from '@fibrae/semi-ui-vue';

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
    const defaultValue = ['zhejiang', 'ningbo', 'jiangbei'];
</script>

<template>
    <Typography.Title :heading="6">单选</Typography.Title>
    <Cascader :defaultValue="defaultValue" placeholder="自定义回填时显示数据的格式" :style="{ width: '300px' }" :treeData="treeData">
        <template #display="display">已选择：{{ display.labels.join(' -> ') }}</template>
    </Cascader>
    <br />
    <br />
    <Typography.Title :heading="6">多选</Typography.Title>
    <Cascader :defaultValue="defaultValue" multiple placeholder="自定义回填时显示数据的格式" :style="{ width: '300px' }" :treeData="treeData">
        <template #tag="tag">
            <Tag color="white" :style="{ marginInlineEnd: '4px' }">{{ tag.entity.data.label }}</Tag>
        </template>
    </Cascader>
</template>
