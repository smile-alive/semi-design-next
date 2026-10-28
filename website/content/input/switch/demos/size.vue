<script setup lang="ts">
    import { Space, Switch } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Space :style="{ marginBottom: '10px', display: 'block' }">
            <Switch aria-label="a switch for demo" size="small" />
            <Switch aria-label="a switch for demo" defaultChecked size="small" />
            <Switch aria-label="a switch for demo" loading size="small" />
            <Switch aria-label="a switch for demo" defaultChecked loading size="small" />
        </Space>
        <Space :style="{ marginBottom: '10px', display: 'block' }">
            <Switch aria-label="a switch for demo" />
            <Switch aria-label="a switch for demo" defaultChecked />
            <Switch aria-label="a switch for demo" loading />
            <Switch aria-label="a switch for demo" defaultChecked loading />
        </Space>
        <Space>
            <Switch aria-label="a switch for demo" size="large" />
            <Switch aria-label="a switch for demo" defaultChecked size="large" />
            <Switch aria-label="a switch for demo" loading size="large" />
            <Switch aria-label="a switch for demo" defaultChecked loading size="large" />
        </Space>
    </div>
</template>
