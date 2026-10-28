<script setup lang="ts">
    import { TabPane, Tabs } from '@fibrae/semi-ui-vue';

    const positions = ['start', 'both', 'end'] as const;
    const indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<template>
    <Tabs v-for="position in positions" :key="position" :arrowPosition="position" collapsible :style="{ width: '60%', margin: '20px' }" type="card">
        <TabPane v-for="i in indexes" :key="i" :itemKey="`Tab-${i}`">
            <template #tab>Tab-{{ i }}</template>
            Content of card tab {{ i }}
        </TabPane>
    </Tabs>
</template>
