<script setup lang="ts">
    import { ref } from 'vue';
    import { Switch } from '@fibrae/semi-ui-vue';

    const checked = ref(true);
</script>

<template>
    <Switch v-model="checked" aria-label="a switch for demo" />
</template>
