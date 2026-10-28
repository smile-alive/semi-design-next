<script setup lang="ts">
    import { Descriptions } from '@fibrae/semi-ui-vue';

    const keyStyle = { width: '120px', color: 'var(--semi-color-primary)' };
</script>

<template>
    <Descriptions align="center">
        <Descriptions.Item :keyStyle="keyStyle">
            <template #itemKey>姓名</template>
            李四
        </Descriptions.Item>
        <Descriptions.Item :keyStyle="keyStyle">
            <template #itemKey>年龄</template>
            28
        </Descriptions.Item>
        <Descriptions.Item :keyStyle="keyStyle">
            <template #itemKey>职业</template>
            前端工程师
        </Descriptions.Item>
    </Descriptions>
</template>
