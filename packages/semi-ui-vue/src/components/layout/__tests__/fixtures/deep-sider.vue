<script setup lang="ts">
    import Layout from '../../index';

    const props = defineProps<{ show?: boolean }>();
</script>

<template>
    <Layout>
        <div>
            <Layout.Sider v-if="props.show" />
        </div>
    </Layout>
</template>
