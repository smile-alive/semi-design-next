<script setup lang="ts">
    import Layout from '../../index';

    const props = defineProps<{ mode: 'v-if' | 'v-for' | 'template' | 'none' }>();
</script>

<template>
    <Layout>
        <Layout.Sider v-if="props.mode === 'v-if'" />
        <Layout.Sider v-for="index in props.mode === 'v-for' ? 2 : 0" :key="index" />
        <template v-if="props.mode === 'template'">
            <Layout.Content />
            <Layout.Sider />
        </template>
        <Layout.Content />
    </Layout>
</template>
