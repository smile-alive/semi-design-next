<script setup lang="ts">
    import { ref } from 'vue';
    import Cropper from '../../cropper.vue';

    const zoom = ref(1);
</script>

<template>
    <Cropper v-model:zoom="zoom" :rotate="0" src="https://example.com/a.png" />
    <span data-testid="zoom">{{ zoom }}</span>
    <button @click="zoom = 1">reset</button>
</template>
