<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, ButtonGroup, TabPane, Tabs } from '@fibrae/semi-ui-vue';

    let newTabIndex = 0;
    const panes = ref([
        { title: 'Tab 1', content: 'Content of Tab Pane 1', itemKey: '1' },
        { title: 'Tab 2', content: 'Content of Tab Pane 2', itemKey: '2' },
    ]);
    const activeKey = ref('1');

    const add = () => {
        const index = newTabIndex++;
        panes.value.push({ title: `New Tab ${index}`, content: 'New Tab Pane', itemKey: `newTab${index}` });
        activeKey.value = `newTab${index}`;
    };

    const remove = () => {
        if (panes.value.length > 1) {
            panes.value.pop();
            activeKey.value = panes.value[panes.value.length - 1].itemKey;
        }
    };
</script>

<template>
    <Tabs v-model:activeKey="activeKey">
        <template #tabBarExtraContent>
            <ButtonGroup>
                <Button @click="add">新增</Button>
                <Button @click="remove">删除</Button>
            </ButtonGroup>
        </template>
        <TabPane v-for="pane in panes" :key="pane.itemKey" :itemKey="pane.itemKey">
            <template #tab>{{ pane.title }}</template>
            {{ pane.content }}
        </TabPane>
    </Tabs>
</template>
