<script setup lang="ts">
    import List, { ListItem } from '../..';

    const props = defineProps<{ dataSource: { id: string; ok: boolean }[] }>();
</script>

<template>
    <List :dataSource="props.dataSource">
        <template #item="{ item }">
            <ListItem v-if="item.ok">{{ item.id }}</ListItem>
            <ListItem v-else>{{ item.id }}!</ListItem>
        </template>
    </List>
</template>
