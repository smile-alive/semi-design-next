<script setup lang="ts">
    import { Card, TabPane, Tabs } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Card title="Card title">
        <Tabs :style="{ marginTop: '-20px', marginBottom: '-20px' }" type="line">
            <TabPane itemKey="1">
                <template #tab>Tab 1</template>
                <p>content1</p>
                <p>content1</p>
                <p>content1</p>
            </TabPane>
            <TabPane itemKey="2">
                <template #tab>Tab 2</template>
                <p>content2</p>
                <p>content2</p>
                <p>content2</p>
            </TabPane>
        </Tabs>
    </Card>
</template>
