<script setup lang="ts">
    import { ref } from 'vue';
    import { Pagination } from '@fibrae/semi-ui-vue';

    const page = ref(3);
</script>

<template>
    <Pagination v-model:currentPage="page" :total="200" />
</template>
