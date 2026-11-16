<script setup lang="ts">
    import List from '../..';

    const props = defineProps<{ show: boolean }>();
</script>

<template>
    <List :dataSource="[]">
        <template #header>
            <span v-if="props.show">header</span>
        </template>
        <template #footer>
            <span v-if="props.show">footer</span>
        </template>
        <template #emptyContent>
            <span v-if="props.show">custom empty</span>
        </template>
    </List>
</template>
