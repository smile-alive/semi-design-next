<script setup lang="ts">
    import { Button, TabPane, Tabs } from '@fibrae/semi-ui-vue';

    const onExtraClick = () => {
        alert('you have clicked me!');
    };
</script>

<template>
    <Tabs defaultActiveKey="1">
        <template #tabBarExtraContent>
            <Button @click="onExtraClick">Extra Action</Button>
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
