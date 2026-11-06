<script setup lang="ts">
    import { TabPane, Tabs } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Tabs defaultActiveKey="1">
        <template #tabBar="bar">
            <div class="tab-bar-box">
                这是二次封装的Tab Bar，当前ActiveKey：{{ bar.tabBarProps.activeKey }}
                <component :is="bar.tabBar" />
            </div>
        </template>
        <TabPane itemKey="1">
            <template #tab>文档</template>
            文档
        </TabPane>
        <TabPane itemKey="2">
            <template #tab>快速起步</template>
            快速起步
        </TabPane>
        <TabPane itemKey="3">
            <template #tab>帮助</template>
            帮助
        </TabPane>
    </Tabs>
</template>
