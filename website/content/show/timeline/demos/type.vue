<script setup lang="ts">
    import { Timeline } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Timeline>
        <Timeline.Item type="ongoing">
            <template #time>2019-07-14 10:35</template>
            审核中
        </Timeline.Item>
        <Timeline.Item type="success">
            <template #time>2019-06-13 16:17</template>
            发布成功
        </Timeline.Item>
        <Timeline.Item type="error">
            <template #time>2019-05-14 18:34</template>
            审核失败
        </Timeline.Item>
    </Timeline>
</template>
