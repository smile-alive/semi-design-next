<script setup lang="ts">
    import { Descriptions, type DescriptionsData } from '@fibrae/semi-ui-vue';

    const keyStyle = { width: '100px', textAlign: 'right' } as const;
    const data: DescriptionsData[] = [
        { key: '用户名', value: '张三', styles: { key: keyStyle } },
        { key: '电子邮箱', value: 'zhangsan@example.com', styles: { key: keyStyle } },
        { key: '联系电话', value: '138-0000-0000', styles: { key: keyStyle } },
        { key: '地址', value: '北京市朝阳区', styles: { key: keyStyle } },
    ];
</script>

<template>
    <Descriptions align="center" :data="data" />
</template>
