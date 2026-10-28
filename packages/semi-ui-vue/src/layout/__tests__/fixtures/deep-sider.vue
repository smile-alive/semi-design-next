<script setup lang="ts">
    import Layout from '../../index';

    defineProps<{ show?: boolean }>();
</script>

<template>
    <Layout>
        <div>
            <Layout.Sider v-if="show" />
        </div>
    </Layout>
</template>
