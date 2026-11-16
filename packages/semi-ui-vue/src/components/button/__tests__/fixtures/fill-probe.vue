<script setup lang="ts">
    const props = defineProps<{ fill?: string | string[] }>();
</script>

<template>
    <span :data-fill="JSON.stringify(props.fill ?? null)" data-testid="icon" />
</template>
