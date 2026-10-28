<script setup lang="ts">
    import { Cascader, Tag, TypographyTitle } from '@fibrae/semi-ui-vue';

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
    <TypographyTitle :heading="6">单选</TypographyTitle>
    <Cascader :defaultValue="defaultValue" placeholder="自定义回填时显示数据的格式" :style="{ width: '300px' }" :treeData="treeData">
        <template #display="{ labels }">已选择：{{ labels.join(' -> ') }}</template>
    </Cascader>
    <br />
    <br />
    <TypographyTitle :heading="6">多选</TypographyTitle>
    <Cascader :defaultValue="defaultValue" multiple placeholder="自定义回填时显示数据的格式" :style="{ width: '300px' }" :treeData="treeData">
        <template #tag="{ entity }">
            <Tag color="white" :style="{ marginRight: '4px' }">{{ entity.data.label }}</Tag>
        </template>
    </Cascader>
</template>
