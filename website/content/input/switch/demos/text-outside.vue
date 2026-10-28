<script setup lang="ts">
    import { ref } from 'vue';
    import { Switch, Typography } from '@fibrae/semi-ui-vue';

    const { Title } = Typography;
    const open = ref<boolean>();
</script>

<template>
    <div :style="{ display: 'flex', alignItems: 'center' }">
        <Title :heading="6" :style="{ margin: '8px' }">{{ open ? '已开启' : '已关闭' }}</Title>
        <Switch v-model="open" aria-label="a switch for demo" />
    </div>
</template>
