<script setup lang="ts">
    import { Button, Space, TabPane, Tabs } from '@fibrae/semi-ui-vue';

    const presets = ['tight', 'medium', 'loose'] as const;
</script>

<template>
    <Tabs type="line">
        <TabPane v-for="(preset, index) in presets" :key="preset" :itemKey="String(index + 1)">
            <template #tab>{{ preset }}</template>
            <Space :spacing="preset" :style="{ marginTop: '15px' }">
                <Button v-for="i in 4" :key="i" theme="solid" type="primary">按钮</Button>
            </Space>
        </TabPane>
        <TabPane itemKey="4">
            <template #tab>array</template>
            <Space :spacing="[8, 16]" :style="{ marginTop: '15px' }" wrap>
                <Button v-for="i in 10" :key="i" theme="solid" type="primary">按钮</Button>
            </Space>
        </TabPane>
    </Tabs>
</template>
