<script setup lang="ts">
    import { TabPane, Tabs } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Tabs defaultActiveKey="1">
        <TabPane itemKey="1">
            <template #tab>文档</template>
            文档
        </TabPane>
        <TabPane disabled itemKey="2">
            <template #tab>快速起步</template>
            快速起步
        </TabPane>
        <TabPane itemKey="3">
            <template #tab>帮助</template>
            帮助
        </TabPane>
    </Tabs>
</template>
