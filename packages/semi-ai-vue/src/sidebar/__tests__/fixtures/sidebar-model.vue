<script setup lang="ts">
    import { shallowRef } from 'vue';
    import Sidebar from '../..';

    const activeKey = shallowRef('file');
    const options = [
        { name: 'Code', key: 'code' },
        { name: 'File', key: 'file' },
    ];
</script>

<template>
    <Sidebar v-model:activeKey="activeKey" :options="options" visible />
</template>
