<script setup lang="ts">
    import { ref } from 'vue';

    const props = defineProps<{ id: string }>();
    const count = ref(0);
</script>

<template>
    <button type="button" @click="count++">{{ props.id }}:{{ count }}</button>
</template>
