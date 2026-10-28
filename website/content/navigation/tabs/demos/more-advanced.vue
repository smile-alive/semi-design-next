<script setup lang="ts">
    import { Button, TabPane, Tabs, type TabsMore } from '@fibrae/semi-ui-vue';

    const indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const more: TabsMore = { count: 4, dropdownProps: { trigger: 'click', position: 'bottomRight' } };
</script>

<template>
    <Tabs :more="more" :style="{ width: '60%', margin: '20px' }" type="card">
        <template #more>
            <Button type="tertiary">Click to show More</Button>
        </template>
        <TabPane v-for="i in indexes" :key="i" :itemKey="`Tab-${i}`">
            <template #tab>Tab-{{ i }}</template>
            Content of card tab {{ i }}
        </TabPane>
    </Tabs>
</template>
