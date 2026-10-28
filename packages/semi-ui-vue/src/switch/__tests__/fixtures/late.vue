<script setup lang="ts">
    import { ref } from 'vue';
    import Switch from '../..';

    const show = ref(false);
</script>

<template>
    <button type="button" @click="show = true">show</button>
    <Switch v-if="show" autofocus />
</template>
