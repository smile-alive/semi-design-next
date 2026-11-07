<script setup lang="ts">
    import { ref } from 'vue';

    defineProps<{ id: string }>();
    const count = ref(0);
</script>

<template>
    <button type="button" @click="count++">{{ id }}:{{ count }}</button>
</template>
