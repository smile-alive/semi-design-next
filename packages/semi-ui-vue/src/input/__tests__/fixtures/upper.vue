<script setup lang="ts">
    import { ref } from 'vue';
    import Input from '../..';

    const text = ref('');
</script>

<template>
    <Input aria-label="upper" :modelValue="text" @change="text = $event.toUpperCase()" />
</template>
