<script setup lang="ts">
    import { ref } from 'vue';
    import { Switch, Typography } from '@fibrae/semi-ui-vue';

    const open = ref<boolean>();
</script>

<template>
    <div :style="{ display: 'flex', alignItems: 'center' }">
        <Typography.Title :heading="6" :style="{ margin: '8px' }">{{ open ? '已开启' : '已关闭' }}</Typography.Title>
        <Switch v-model="open" aria-label="a switch for demo" />
    </div>
</template>
