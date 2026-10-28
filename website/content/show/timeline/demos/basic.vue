<script setup lang="ts">
    import { Timeline } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Timeline>
        <Timeline.Item>
            <template #time>2019-07-14 10:35</template>
            第一个节点内容
        </Timeline.Item>
        <Timeline.Item>
            <template #time>2019-06-13 16:17</template>
            第二个节点内容
        </Timeline.Item>
        <Timeline.Item>
            <template #time>2019-05-14 18:34</template>
            第三个节点内容
        </Timeline.Item>
    </Timeline>
</template>
