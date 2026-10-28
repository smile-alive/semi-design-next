<script setup lang="ts">
    import List from '../..';

    defineProps<{ show: boolean }>();
</script>

<template>
    <List :dataSource="[]">
        <template #header>
            <span v-if="show">header</span>
        </template>
        <template #footer>
            <span v-if="show">footer</span>
        </template>
        <template #emptyContent>
            <span v-if="show">custom empty</span>
        </template>
    </List>
</template>
