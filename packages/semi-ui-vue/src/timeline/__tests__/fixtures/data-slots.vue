<script setup lang="ts">
    import Timeline, { type TimelineData } from '../../index';

    defineProps<{ dataSource: TimelineData[] }>();
</script>

<template>
    <Timeline :dataSource="dataSource">
        <template #content="{ item, index }">
            <strong v-if="index === 1" class="rich">{{ item.content }}</strong>
            <template v-else>{{ item.content }}</template>
        </template>
        <template #dot="{ index }">
            <i v-if="index === 2" class="own-dot" />
        </template>
        <template #time="{ item, index }">
            <em v-if="index === 0">{{ item.time }}!</em>
            <template v-else>{{ item.time }}</template>
        </template>
        <template #extra="{ item, index }">{{ index }}:{{ item.extra }}</template>
    </Timeline>
</template>
