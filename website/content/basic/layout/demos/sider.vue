<script setup lang="ts">
    import { Layout } from '@fibrae/semi-ui-vue';

    const commonStyle = {
        height: '64px',
        lineHeight: '64px',
        background: 'var(--semi-color-fill-0)',
    };
</script>

<template>
    <Layout class="components-layout-demo">
        <Layout.Sider :style="{ width: '120px', background: 'var(--semi-color-fill-2)' }">Sider</Layout.Sider>
        <Layout>
            <Layout.Header :style="commonStyle">Header</Layout.Header>
            <Layout.Content :style="{ height: '300px', lineHeight: '300px' }">Content</Layout.Content>
            <Layout.Footer :style="commonStyle">Footer</Layout.Footer>
        </Layout>
    </Layout>
</template>
