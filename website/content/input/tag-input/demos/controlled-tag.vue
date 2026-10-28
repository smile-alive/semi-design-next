<script setup lang="ts">
    import { ref } from 'vue';
    import { TagInput } from '@fibrae/semi-ui-vue';

    const value = ref(['抖音']);
</script>

<template>
    <TagInput v-model="value" />
</template>
