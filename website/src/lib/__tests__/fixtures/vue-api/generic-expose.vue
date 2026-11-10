<script setup lang="ts" generic="T">
    defineProps<{ value?: T }>();
    defineExpose({ reset: (next?: T) => next });
</script>

<template>
    <div />
</template>
