<script setup lang="ts">
    import Transfer, { type TransferDataItem } from '../..';

    withDefaults(defineProps<{ dataSource?: TransferDataItem[] }>(), { dataSource: () => [] });
</script>

<template>
    <Transfer :dataSource="dataSource" :defaultValue="['a']">
        <template #emptyLeft />
        <template #emptySearch />
        <template #label="{ item }">
            <b class="custom-label">{{ item.label }}!</b>
        </template>
    </Transfer>
</template>
