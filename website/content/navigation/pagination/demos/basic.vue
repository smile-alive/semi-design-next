<script setup lang="ts">
    import { Pagination } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Pagination :style="{ marginBottom: '12px' }" :total="30" />
        <Pagination :style="{ marginBottom: '12px' }" :total="80" />
        <Pagination :style="{ marginBottom: '12px' }" :total="200" />
        <Pagination :pageSize="30" :style="{ marginBottom: '12px' }" :total="80" />
    </div>
</template>
