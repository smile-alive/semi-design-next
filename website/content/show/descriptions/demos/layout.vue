<script setup lang="ts">
    import { Descriptions, Space, Tag } from '@fibrae/semi-ui-vue';

    const data = [
        { key: '抖音号', value: 'SemiDesign' },
        { key: '主播类型', value: '自由主播' },
        { key: '安全等级', value: '3级' },
        { key: '垂类标签', value: '互联网资讯 编程' },
        { key: '作品数量', value: '88888888' },
        { key: '认证状态', value: '这是一个很长很长很长很长很长很长很长很长很长的值', span: 3 },
    ];
</script>

<template>
    <Descriptions align="plain" :column="4" :data="data" layout="vertical">
        <template #value="{ item, index }">
            <Space v-if="index === 3">
                <Tag color="amber" shape="circle" size="small">互联网资讯</Tag>
                <Tag color="violet" shape="circle" size="small">编程</Tag>
            </Space>
            <template v-else>{{ item.value }}</template>
        </template>
    </Descriptions>
</template>
