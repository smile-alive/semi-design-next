<script setup lang="ts">
    import { ref } from 'vue';
    import Pagination from '../..';

    const emit = defineEmits<{ change: [page: number, size: number] }>();
    const size = ref(10);
</script>

<template>
    <Pagination v-model:pageSize="size" :defaultCurrentPage="5" showSizeChanger :total="200" @change="(page, pageSize) => emit('change', page, pageSize)" />
    <output aria-label="size">{{ size }}</output>
    <button type="button" @click="size = 50">set 50</button>
</template>
