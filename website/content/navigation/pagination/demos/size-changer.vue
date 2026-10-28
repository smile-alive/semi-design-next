<script setup lang="ts">
    import { Pagination } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Pagination showSizeChanger style="margin-bottom: 12px" :total="80" />
        <Pagination showSizeChanger :total="300" />
    </div>
</template>
