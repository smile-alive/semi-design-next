<script setup lang="ts">
    import { IconAlertTriangle } from '@fibrae/semi-icons-vue';
    import { Timeline } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Timeline>
        <Timeline.Item>
            <template #time>2019-07-14 10:35</template>
            默认样式的节点
        </Timeline.Item>
        <Timeline.Item type="warning">
            <template #time>2019-06-13 16:17</template>
            <template #dot>
                <IconAlertTriangle />
            </template>
            自定义图标
        </Timeline.Item>
        <Timeline.Item color="pink">
            <template #time>2019-05-14 18:34</template>
            自定义节点颜色
        </Timeline.Item>
        <Timeline.Item>
            <template #time>2019-04-10 12:20</template>
            <span :style="{ fontSize: '18px' }">自定义节点样式</span>
        </Timeline.Item>
    </Timeline>
</template>
