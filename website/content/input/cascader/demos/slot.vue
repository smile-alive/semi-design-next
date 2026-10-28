<script setup lang="ts">
    import { Cascader, Typography } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;

    const slotStyle = {
        height: '36px',
        display: 'flex',
        padding: '0 32px',
        alignItems: 'center',
        cursor: 'pointer',
        borderTop: '1px solid var(--semi-color-border)',
    };

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
    <Cascader placeholder="请选择所在地区" style="width: 300px" :treeData="treeData">
        <template #bottomSlot>
            <div :style="slotStyle">
                <Text>找不到相关选项？</Text>
                <Text link>去新建</Text>
            </div>
        </template>
    </Cascader>
</template>
