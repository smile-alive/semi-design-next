<script setup lang="ts">
    import { ref } from 'vue';
    import { TabItem, TabPane, Tabs } from '@fibrae/semi-ui-vue';

    const activeKey = ref('1');
    const items = ref([
        { itemKey: '1', tab: '文档', content: '文档内容' },
        { itemKey: '2', tab: '表格', content: '表格内容' },
        { itemKey: '3', tab: '幻灯片', content: '幻灯片内容' },
        { itemKey: '4', tab: '表单', content: '表单内容' },
    ]);

    // HTML5 drag and drop on the TabItems: the website has no @dnd-kit/vue, and a Vue sortable list would wrap each tab
    // in a button-role element that nests focusable tabs. Known limit: pointer only; use dnd-kit for keyboard sorting.
    const draggingKey = ref<string | null>(null);
    const moveTo = (targetKey: string) => {
        const from = items.value.findIndex((item) => item.itemKey === draggingKey.value);
        const to = items.value.findIndex((item) => item.itemKey === targetKey);
        if (from < 0 || to < 0 || from === to) return;
        const [moved] = items.value.splice(from, 1);
        items.value.splice(to, 0, moved);
    };
</script>

<template>
    <Tabs v-model:activeKey="activeKey" type="line">
        <!-- the bar keeps Semi's own .semi-tabs-bar shell; the TabItems inside select their Tabs by themselves -->
        <template #tabBar>
            <div aria-orientation="horizontal" class="semi-tabs-bar semi-tabs-bar-line semi-tabs-bar-top" role="tablist">
                <TabItem
                    v-for="item in items"
                    :key="item.itemKey"
                    draggable="true"
                    :itemKey="item.itemKey"
                    :selected="activeKey === item.itemKey"
                    :style="{ cursor: 'grab', opacity: draggingKey === item.itemKey ? 0.5 : 1, display: 'inline-flex' }"
                    @dragend="draggingKey = null"
                    @dragenter.prevent="moveTo(item.itemKey)"
                    @dragover.prevent
                    @dragstart="draggingKey = item.itemKey"
                >
                    <template #tab>{{ item.tab }}</template>
                </TabItem>
            </div>
        </template>
        <TabPane v-for="item in items" :key="item.itemKey" :itemKey="item.itemKey">
            <div :style="{ padding: '20px' }">{{ item.content }}</div>
        </TabPane>
    </Tabs>
</template>
