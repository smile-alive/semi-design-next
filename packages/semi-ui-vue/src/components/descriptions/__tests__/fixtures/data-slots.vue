<script setup lang="ts">
    import Descriptions, { type DescriptionsData, type DescriptionsLayout } from '../../index';

    defineProps<{ data: DescriptionsData[]; layout?: DescriptionsLayout; column?: number }>();
</script>

<template>
    <Descriptions :column="column" :data="data" :layout="layout">
        <template #itemKey="{ item, index }">
            <strong v-if="index === 0" class="rich-key">{{ item.key }}</strong>
            <template v-else>{{ index }}:{{ item.key }}</template>
        </template>
        <template #value="{ item, index }">
            <em v-if="item.key === 'tag'" class="rich-value">{{ item.value }}</em>
            <template v-else>{{ item.value }}@{{ index }}</template>
        </template>
    </Descriptions>
</template>
