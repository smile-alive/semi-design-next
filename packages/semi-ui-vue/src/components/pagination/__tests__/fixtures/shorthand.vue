<script setup lang="ts">
    import Pagination from '../..';

    const props = withDefaults(defineProps<{ total?: number }>(), { total: 200 });
</script>

<template>
    <Pagination disabled hideOnSinglePage showTotal :total="props.total" />
</template>
