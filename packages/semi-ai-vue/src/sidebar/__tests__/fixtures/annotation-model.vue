<script setup lang="ts">
    import { shallowRef } from 'vue';
    import Annotation from '../../annotation';

    const activeKey = shallowRef<string | string[]>([]);
    const info = [
        { header: 'Group 1', key: '1', annotations: [{ title: 'Shown' }] },
        { header: 'Group 2', key: '2', annotations: [{ title: 'Hidden' }] },
    ];
</script>

<template>
    <Annotation v-model:activeKey="activeKey" :info="info" visible />
</template>
