<script setup lang="ts">
    import { ref } from 'vue';
    import Radio from '../..';

    // The test renderer mounts into a detached node, so autofocus is only observable on a radio mounted later.
    const show = ref(false);
</script>

<template>
    <button type="button" @click="show = true">show</button>
    <Radio v-if="show" autofocus name="n">A</Radio>
</template>
