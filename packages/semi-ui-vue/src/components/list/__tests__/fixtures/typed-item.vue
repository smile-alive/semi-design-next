<script setup lang="ts">
    import List, { ListItem } from '../..';

    const people = [{ name: 'Ada' }, { name: 'Alan' }];
</script>

<template>
    <List :dataSource="people">
        <template #item="{ item, index }">
            <ListItem>{{ index }}:{{ item.name.toUpperCase() }}</ListItem>
        </template>
    </List>
</template>
