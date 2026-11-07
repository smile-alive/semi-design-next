<script setup lang="ts">
    import List, { ListItem } from '../..';

    defineProps<{ rows: string[]; show?: boolean }>();
</script>

<template>
    <List>
        <ListItem v-for="row in rows" :key="row">{{ row }}</ListItem>
        <ListItem v-if="show">shown</ListItem>
    </List>
</template>
