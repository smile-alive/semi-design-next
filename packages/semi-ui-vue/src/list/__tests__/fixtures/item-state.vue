<script setup lang="ts">
    import { ref } from 'vue';
    import List, { ListItem } from '../..';

    const header = ref(false);
</script>

<template>
    <button type="button" @click="header = !header">toggle</button>
    <List>
        <ListItem>
            <template v-if="header" #header>head</template>
            <input aria-label="state" />
        </ListItem>
    </List>
</template>
