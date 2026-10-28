<script setup lang="ts">
    import { ref } from 'vue';
    import { Banner, Button, Layout } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const toggle = () => {
        visible.value = !visible.value;
    };

    const commonStyle = {
        height: '64px',
        lineHeight: '64px',
        background: 'var(--semi-color-fill-0)',
    };
</script>

<template>
    <Layout class="components-layout-demo banner-basic">
        <Layout.Header :style="commonStyle">Header</Layout.Header>
        <Banner v-if="visible" @close="toggle">
            <template #description>Semi D2C 现已支持 Figma DevMode, 安装插件，随时查阅图层对应的前端代码</template>
        </Banner>
        <Layout.Content style="height: 300px; line-height: 300px">Content</Layout.Content>
        <Layout.Footer :style="commonStyle">Footer</Layout.Footer>
    </Layout>
    <Button style="display: block; width: 120px; margin: 0 auto" @click="toggle">
        {{ visible ? 'Hide Banner' : 'Show Banner' }}
    </Button>
</template>
