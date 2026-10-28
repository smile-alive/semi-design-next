<script setup lang="ts">
    import { ref } from 'vue';
    import { Dropdown, TabPane, Tabs } from '@fibrae/semi-ui-vue';

    const activeKey = ref('Tab-0');
    const indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const arrowStyle = {
        width: '32px',
        height: '32px',
        margin: '0 12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0',
        border: 'none',
        borderRadius: '100%',
        background: 'var(--semi-grey-1)',
        color: 'var(--semi-color-text)',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        cursor: 'pointer',
    };
</script>

<template>
    <Tabs v-model:activeKey="activeKey" collapsible :style="{ width: '50%', margin: '20px' }" type="card">
        <template #arrow="{ items, position, onClick }">
            <Dropdown>
                <button :style="arrowStyle" type="button" @click="onClick">
                    {{ position === 'start' ? '←' : '→' }}
                </button>
                <template #content>
                    <Dropdown.Menu>
                        <Dropdown.Item v-for="item in items" :key="item.itemKey" @click="activeKey = item.itemKey">
                            {{ item.itemKey }}
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </template>
            </Dropdown>
        </template>
        <TabPane v-for="i in indexes" :key="i" :itemKey="`Tab-${i}`">
            <template #tab>Tab-{{ i }}</template>
            Content of card tab {{ i }}
        </TabPane>
    </Tabs>
</template>
