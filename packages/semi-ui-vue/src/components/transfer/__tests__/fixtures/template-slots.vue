<script setup lang="ts">
    import Transfer, { type TransferDataItem } from '../..';

    const props = withDefaults(defineProps<{ dataSource?: TransferDataItem[] }>(), { dataSource: () => [] });
</script>

<template>
    <Transfer :dataSource="props.dataSource" :defaultValue="['a']">
        <template #emptyLeft />
        <template #emptySearch />
        <template #label="{ item }">
            <b class="custom-label">{{ item.label }}!</b>
        </template>
    </Transfer>
</template>
