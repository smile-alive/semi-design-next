<script setup lang="ts">
    defineProps<{ fill?: string | string[] }>();
</script>

<template>
    <span :data-fill="JSON.stringify(fill ?? null)" data-testid="icon" />
</template>
