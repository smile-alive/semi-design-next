<script setup lang="ts">
    import Timeline from '../../index';

    const props = defineProps<{ showSecond?: boolean; extra?: string[] }>();
</script>

<template>
    <Timeline mode="alternate">
        <Timeline.Item>a</Timeline.Item>
        <Timeline.Item v-if="props.showSecond">b</Timeline.Item>
        <Timeline.Item>c</Timeline.Item>
        <Timeline.Item v-for="text in props.extra" :key="text">{{ text }}</Timeline.Item>
    </Timeline>
</template>
