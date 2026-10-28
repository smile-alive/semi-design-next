<script setup lang="ts">
    defineProps<{ label: string }>();
</script>

<template>
    <section class="own-slide">{{ label }}</section>
</template>
