<script setup lang="ts">
    import Descriptions, { DescriptionsItem, type DescriptionsLayout } from '../../index';

    const props = defineProps<{ layout?: DescriptionsLayout; column?: number; extra?: string[] }>();
</script>

<template>
    <Descriptions :column="props.column" :layout="props.layout">
        text
        <Descriptions.Item hidden><template #itemKey>hidden</template>0</Descriptions.Item>
        <span class="not-an-item">other</span>
        <DescriptionsItem :span="2"><template #itemKey>a</template>1</DescriptionsItem>
        <DescriptionsItem v-for="key in props.extra" :key="key">
            <template #itemKey>{{ key }}</template>
            {{ key }}-value
        </DescriptionsItem>
    </Descriptions>
</template>
