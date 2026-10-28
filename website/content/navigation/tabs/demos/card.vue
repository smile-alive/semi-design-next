<script setup lang="ts">
    import { ref } from 'vue';
    import { Tabs } from '@fibrae/semi-ui-vue';

    const contentList = ['文档', '快速起步', '帮助'];
    const tabList = [
        { tab: '文档', itemKey: '1' },
        { tab: '快速起步', itemKey: '2' },
        { tab: '帮助', itemKey: '3' },
    ];
    const key = ref('1');
</script>

<template>
    <Tabs v-model:activeKey="key" :tabList="tabList" type="card">
        <div>{{ contentList[Number(key) - 1] }}</div>
    </Tabs>
</template>
