<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { Sidebar } from '@fibrae/semi-ai-vue';
    import { Button, Switch } from '@fibrae/semi-ui-vue';

    const { Container } = Sidebar;

    const containerStyle = {
        display: 'flex',
        height: '500px',
        border: '1px solid var(--semi-color-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxSizing: 'border-box',
    } as const;

    const visible = shallowRef(true);
    const motion = shallowRef(true);
    const resizable = shallowRef(true);
</script>

<template>
    <div :style="containerStyle">
        <div :style="{ flexGrow: 1, flexShrink: 1, padding: '20px' }">
            <div>
                <Button :aria-pressed="visible" @click="visible = !visible">显示容器</Button>
                <div :style="{ display: 'flex', alignItems: 'center', marginTop: '10px' }">
                    <span id="sidebar-container-motion">是否有动画</span>
                    <Switch v-model="motion" aria-labelledby="sidebar-container-motion" />
                </div>
                <div :style="{ display: 'flex', alignItems: 'center', marginTop: '10px' }">
                    <span id="sidebar-container-resizable">是否可伸缩</span>
                    <Switch v-model="resizable" aria-labelledby="sidebar-container-resizable" />
                </div>
            </div>
        </div>
        <Container v-model:visible="visible" maxWidth="60%" :minWidth="250" :motion="motion" :resizable="resizable" :style="resizable ? undefined : { width: '200px' }" title="基础容器示例" />
    </div>
</template>
