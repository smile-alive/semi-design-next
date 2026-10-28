<script setup lang="ts">
    import { IconAlertTriangle } from '@fibrae/semi-icons-vue';
    import { Timeline, type TimelineData } from '@fibrae/semi-ui-vue';

    const dataSource: TimelineData[] = [
        {
            time: '2019-07-14 10:35',
            extra: '节点辅助说明信息',
            content: '第一个节点内容',
            type: 'ongoing',
        },
        {
            time: '2019-06-13 16:17',
            extra: '节点辅助说明信息',
            content: '第二个节点内容',
            color: 'pink',
        },
        {
            time: '2019-05-14 18:34',
            extra: '节点辅助说明信息',
            content: '第三个节点内容',
            type: 'warning',
        },
        {
            time: '2019-05-09 09:12',
            extra: '节点辅助说明信息',
            content: '第四个节点内容',
            type: 'success',
        },
    ];
</script>

<template>
    <Timeline :dataSource="dataSource" mode="alternate">
        <template #content="{ item, index }">
            <span v-if="index === 1" :style="{ fontSize: '18px' }">{{ item.content }}</span>
            <template v-else>{{ item.content }}</template>
        </template>
        <template #dot="{ index }">
            <IconAlertTriangle v-if="index === 2" />
        </template>
    </Timeline>
</template>
