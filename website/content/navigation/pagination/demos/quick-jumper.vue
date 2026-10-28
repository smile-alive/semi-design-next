<script setup lang="ts">
    import { Pagination } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Pagination showQuickJumper style="margin-bottom: 12px" :total="80" />
        <Pagination showQuickJumper :total="300" />
    </div>
</template>
