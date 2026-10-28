<script setup lang="ts">
    import { Pagination } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Pagination :defaultCurrentPage="3" showTotal :total="80" />
    </div>
</template>
