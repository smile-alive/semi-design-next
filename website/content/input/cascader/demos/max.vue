<script setup lang="ts">
    import { Cascader, Toast, type CascaderEntity } from '@fibrae/semi-ui-vue';

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
    const defaultValue = [['zhejiang', 'ningbo', 'haishu']];

    const onExceed = (v: CascaderEntity[]) => {
        Toast.warning('exceed max');
        console.log(v);
    };
</script>

<template>
    <Cascader :defaultValue="defaultValue" :max="1" multiple placeholder="请选择所在地区" :style="{ width: '300px' }" :treeData="treeData" @exceed="onExceed" />
</template>
