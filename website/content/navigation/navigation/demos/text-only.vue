<script setup lang="ts">
    import { Nav } from '@fibrae/semi-ui-vue';

    const items = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'union-management', text: '任务管理', items: ['公告设置', '任务查询', '信息录入'] },
        { text: '任务平台', itemKey: 'task', items: ['任务管理', '用户任务查询'] },
    ];
</script>

<template>
    <Nav :bodyStyle="{ height: '300px' }" :defaultOpenKeys="['task']" :items="items" @click="(data) => console.log('trigger onClick: ', data)" @select="(data) => console.log('trigger onSelect: ', data)" />
</template>
