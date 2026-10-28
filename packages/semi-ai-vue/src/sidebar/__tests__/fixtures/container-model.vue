<script setup lang="ts">
    import { shallowRef } from 'vue';
    import Sidebar from '../..';

    const visible = shallowRef(true);
</script>

<template>
    <span :data-visible="String(visible)" />
    <Sidebar.Container v-model:visible="visible" :motion="false" title="Title" />
</template>
