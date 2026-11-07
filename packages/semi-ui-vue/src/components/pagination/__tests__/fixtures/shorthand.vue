<script setup lang="ts">
    import Pagination from '../..';

    withDefaults(defineProps<{ total?: number }>(), { total: 200 });
</script>

<template>
    <Pagination disabled hideOnSinglePage showTotal :total="total" />
</template>
