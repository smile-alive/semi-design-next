<script setup lang="ts">
    import Layout from '../../index';
</script>

<template>
    <Layout id="root" aria-label="app" data-testid="layout">
        <Layout.Header aria-label="top" data-testid="header" role="toolbar" />
        <Layout.Content aria-label="body" data-testid="content" />
        <Layout.Footer data-testid="footer" role="note" />
    </Layout>
</template>
