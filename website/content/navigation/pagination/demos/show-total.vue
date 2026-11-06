<script setup lang="ts">
    import { Pagination } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Pagination showTotal style="margin-block-end: 12px" :total="80" />
        <Pagination showTotal style="margin-block-end: 12px" :total="200" />
    </div>
</template>
