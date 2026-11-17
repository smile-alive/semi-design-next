<script setup lang="ts">
    import { Pagination } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Pagination aria-label="Pagination of 80 items" showTotal style="margin-block-end: 12px" :total="80" />
        <Pagination aria-label="Pagination of 200 items" showTotal style="margin-block-end: 12px" :total="200" />
    </div>
</template>
