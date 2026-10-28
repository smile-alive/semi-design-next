<script setup lang="ts">
    import Descriptions, { DescriptionsItem, type DescriptionsLayout } from '../../index';

    defineProps<{ layout?: DescriptionsLayout; column?: number; extra?: string[] }>();
</script>

<template>
    <Descriptions :column="column" :layout="layout">
        text
        <Descriptions.Item hidden><template #itemKey>hidden</template>0</Descriptions.Item>
        <span class="not-an-item">other</span>
        <DescriptionsItem :span="2"><template #itemKey>a</template>1</DescriptionsItem>
        <DescriptionsItem v-for="key in extra" :key="key">
            <template #itemKey>{{ key }}</template>
            {{ key }}-value
        </DescriptionsItem>
    </Descriptions>
</template>
