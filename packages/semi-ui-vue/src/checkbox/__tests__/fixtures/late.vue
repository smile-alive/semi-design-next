<script setup lang="ts">
    import { ref } from 'vue';
    import Checkbox from '../..';

    const show = ref(false);
</script>

<template>
    <button type="button" @click="show = true">show</button>
    <Checkbox v-if="show" autofocus>label</Checkbox>
</template>
