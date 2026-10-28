<script setup lang="ts">
    import { ref } from 'vue';
    import Tabs, { TabPane } from '../..';

    const activeKey = ref('a');
</script>

<template>
    <span data-testid="key">{{ activeKey }}</span>
    <Tabs v-model:activeKey="activeKey">
        <TabPane itemKey="a"><template #tab>A</template>content a</TabPane>
        <TabPane itemKey="b"><template #tab>B</template>content b</TabPane>
    </Tabs>
</template>
