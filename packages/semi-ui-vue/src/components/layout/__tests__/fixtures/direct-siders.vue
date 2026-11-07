<script setup lang="ts">
    import Layout from '../../index';

    defineProps<{ mode: 'v-if' | 'v-for' | 'template' | 'none' }>();
</script>

<template>
    <Layout>
        <Layout.Sider v-if="mode === 'v-if'" />
        <Layout.Sider v-for="index in mode === 'v-for' ? 2 : 0" :key="index" />
        <template v-if="mode === 'template'">
            <Layout.Content />
            <Layout.Sider />
        </template>
        <Layout.Content />
    </Layout>
</template>
