<script setup lang="ts">
    import { ref } from 'vue';
    import { TabPane, Tabs } from '@fibrae/semi-ui-vue';

    const tabList = ref([
        { tab: '文档', itemKey: '1', text: '文档', closable: true },
        { tab: '快速起步', itemKey: '2', text: '快速起步', closable: true },
        { tab: '帮助', itemKey: '3', text: '帮助', closable: false },
    ]);

    const close = (key: string) => {
        tabList.value = tabList.value.filter((t) => t.itemKey !== key);
    };
</script>

<template>
    <Tabs defaultActiveKey="1" type="card" @tabClose="close">
        <TabPane v-for="t in tabList" :key="t.itemKey" :closable="t.closable" :itemKey="t.itemKey">
            <template #tab>{{ t.tab }}</template>
            {{ t.text }}
        </TabPane>
    </Tabs>
</template>
