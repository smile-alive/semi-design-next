<script setup lang="ts">
    import OverflowList from '../..';

    const rows = [
        { key: 'a', label: 'Ada' },
        { key: 'b', label: 'Alan' },
    ];
</script>

<template>
    <OverflowList :items="rows">
        <template #item="{ item, index }">
            <span>{{ index }}:{{ item.label.toUpperCase() }}</span>
        </template>
        <template #overflow="{ items, position }">
            <span>{{ position }}:{{ items.map((row) => row.label).join() }}</span>
        </template>
    </OverflowList>
</template>
