<script setup lang="ts">
    import { onMounted } from 'vue';

    const emit = defineEmits<{ mounted: [] }>();
    onMounted(() => emit('mounted'));
</script>

<template>
    <input />
</template>
