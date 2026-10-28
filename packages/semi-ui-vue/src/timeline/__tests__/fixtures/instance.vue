<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Timeline, { TimelineItem } from '../../index';

    const emit = defineEmits<{ els: [list: Element, item: Element] }>();
    const list = useTemplateRef('list');
    const item = useTemplateRef('item');
    onMounted(() => emit('els', list.value?.$el, item.value?.$el));
</script>

<template>
    <Timeline ref="list">
        <TimelineItem ref="item">a</TimelineItem>
    </Timeline>
</template>
