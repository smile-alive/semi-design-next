<script setup lang="ts">
    import { Button, Space, TabPane, Tabs } from '@fibrae/semi-ui-vue';

    const fourButtons = [1, 2, 3, 4];
    const tenButtons = Array.from({ length: 10 }, (_, index) => index);
</script>

<template>
    <Tabs type="line">
        <TabPane itemKey="1">
            <template #tab>tight</template>
            <Space spacing="tight" :style="{ marginBlockStart: '15px' }">
                <Button v-for="item in fourButtons" :key="item" theme="solid" type="primary">按钮</Button>
            </Space>
        </TabPane>
        <TabPane itemKey="2">
            <template #tab>medium</template>
            <Space spacing="medium" :style="{ marginBlockStart: '15px' }">
                <Button v-for="item in fourButtons" :key="item" theme="solid" type="primary">按钮</Button>
            </Space>
        </TabPane>
        <TabPane itemKey="3">
            <template #tab>loose</template>
            <Space spacing="loose" :style="{ marginBlockStart: '15px' }">
                <Button v-for="item in fourButtons" :key="item" theme="solid" type="primary">按钮</Button>
            </Space>
        </TabPane>
        <TabPane itemKey="4">
            <template #tab>array</template>
            <Space :spacing="[8, 16]" :style="{ marginBlockStart: '15px' }" wrap>
                <Button v-for="item in tenButtons" :key="item" theme="solid" type="primary">按钮</Button>
            </Space>
        </TabPane>
    </Tabs>
</template>
