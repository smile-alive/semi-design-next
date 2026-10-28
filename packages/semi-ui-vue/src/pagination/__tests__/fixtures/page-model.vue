<script setup lang="ts">
    import { ref } from 'vue';
    import Pagination from '../..';

    const props = withDefaults(defineProps<{ initial?: number }>(), { initial: 1 });
    const page = ref(props.initial);
</script>

<template>
    <Pagination v-model:currentPage="page" :total="200" />
    <output aria-label="page">{{ page }}</output>
    <button type="button" @click="page = 12">jump</button>
</template>
