<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, SideSheet } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const getContainer = () => document.querySelector('.sidesheet-container') as HTMLElement;
</script>

<template>
    <div
        class="sidesheet-container"
        :style="{
            height: '320px',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid var(--semi-color-border)',
            borderRadius: '2px',
            padding: '24px',
            textAlign: 'center',
            background: 'var(--semi-color-fill-0)',
        }"
    >
        <span>Render in this</span>
        <br />
        <br />
        <Button @click="visible = true">Open SideSheet</Button>
        <SideSheet v-model:visible="visible" :getPopupContainer="getContainer" title="渲染在指定容器内部" :width="220">
            <p>This is the content of a basic sidesheet.</p>
            <p>Here is more content...</p>
        </SideSheet>
    </div>
</template>
