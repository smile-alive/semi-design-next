<script setup lang="ts">
    const props = defineProps<{ label: string }>();
</script>

<template>
    <section class="own-slide">{{ props.label }}</section>
</template>
