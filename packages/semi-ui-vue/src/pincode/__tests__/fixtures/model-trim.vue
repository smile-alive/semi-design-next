<script setup lang="ts">
    import { ref } from 'vue';
    import PinCode from '../..';

    const value = ref('');
</script>

<template>
    <PinCode v-model.trim="value" />
</template>
