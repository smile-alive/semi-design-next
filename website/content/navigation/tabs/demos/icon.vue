<script setup lang="ts">
    import { IconFile, IconGlobe, IconHelpCircle } from '@fibrae/semi-icons-vue';
    import { TabPane, Tabs } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Tabs>
        <TabPane itemKey="1">
            <template #tab>
                <span><IconFile />文档</span>
            </template>
            文档
        </TabPane>
        <TabPane itemKey="2">
            <template #tab>
                <span><IconGlobe />快速起步</span>
            </template>
            快速起步
        </TabPane>
        <TabPane itemKey="3">
            <template #tab>
                <span><IconHelpCircle />帮助</span>
            </template>
            帮助
        </TabPane>
    </Tabs>
</template>
