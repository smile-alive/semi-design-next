<script setup lang="ts">
    import Badge from '../../badge.vue';

    const props = defineProps<{ count?: number | string }>();
</script>

<template>
    <Badge :count="props.count" theme="light" type="danger">
        <span>Semi</span>
        <template #count>
            <i data-testid="icon" />
        </template>
    </Badge>
</template>
