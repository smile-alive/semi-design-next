<script setup lang="ts">
    import List, { ListItem } from '../..';

    const props = defineProps<{ rows: string[]; show?: boolean }>();
</script>

<template>
    <List>
        <ListItem v-for="row in props.rows" :key="row">{{ row }}</ListItem>
        <ListItem v-if="props.show">shown</ListItem>
    </List>
</template>
