<script setup lang="ts">
    import { Empty, Typography } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;
</script>

<template>
    <Empty title="暂未找到匹配的筛选结果">
        <template #description>
            <span>
                <Text>试试 </Text>
                <Text link>重置筛选条件</Text>
            </span>
        </template>
    </Empty>
</template>
