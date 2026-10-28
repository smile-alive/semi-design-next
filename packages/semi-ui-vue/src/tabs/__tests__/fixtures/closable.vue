<script setup lang="ts">
    import { ref } from 'vue';
    import Tabs, { TabPane } from '../..';

    const list = ref([
        { tab: '文档', itemKey: '1', closable: true },
        { tab: '快速起步', itemKey: '2', closable: true },
        { tab: '帮助', itemKey: '3', closable: false },
    ]);
    const close = (key: string) => {
        list.value = list.value.filter((item) => item.itemKey !== key);
    };
</script>

<template>
    <Tabs defaultActiveKey="1" type="card" @tabClose="close">
        <TabPane v-for="item in list" :key="item.itemKey" :closable="item.closable" :itemKey="item.itemKey">
            <template #tab>{{ item.tab }}</template>
            {{ item.tab }}
        </TabPane>
    </Tabs>
</template>
