<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Button, TabPane, Tabs } from '@fibrae/semi-ui-vue';

    const count = ref(8);
    const indexes = computed(() => Array.from({ length: count.value }, (_, i) => i));

    const boxStyle = { border: '1px solid var(--semi-color-border)', padding: '12px' };
    const noteStyle = { marginBottom: '8px', color: 'var(--semi-color-text-2)', fontSize: '12px' };
</script>

<template>
    <div>
        <div :style="{ marginBottom: '12px' }">
            <Button :style="{ marginRight: '8px' }" @click="count = Math.max(3, count - 2)">减少 Tab</Button>
            <Button @click="count = Math.min(15, count + 2)">增加 Tab</Button>
            <span :style="{ marginLeft: '12px' }">当前 Tab 数量: {{ count }}</span>
        </div>

        <div :style="{ ...boxStyle, marginBottom: '16px' }">
            <p :style="noteStyle">collapsible="auto" - 自动检测溢出</p>
            <Tabs collapsible="auto" type="card">
                <TabPane v-for="i in indexes" :key="i" :itemKey="`${i}`">
                    <template #tab>Tab-{{ i + 1 }}</template>
                    Content of Tab {{ i + 1 }}
                </TabPane>
            </Tabs>
        </div>

        <div :style="{ ...boxStyle, maxWidth: '400px' }">
            <p :style="noteStyle">固定宽度 400px，测试较窄容器</p>
            <Tabs collapsible="auto" type="card">
                <TabPane v-for="i in indexes" :key="i" :itemKey="`${i}`">
                    <template #tab>Tab-{{ i + 1 }}</template>
                    Content of Tab {{ i + 1 }}
                </TabPane>
            </Tabs>
        </div>
    </div>
</template>
