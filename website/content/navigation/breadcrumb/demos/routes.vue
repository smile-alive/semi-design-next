<script setup lang="ts">
    import { IconArticle, IconHome } from '@fibrae/semi-icons-vue';
    import { Breadcrumb, type Route } from '@fibrae/semi-ui-vue';

    const iconRoutes: (Route | string)[] = [{ path: '/', href: '/' }, { path: '/breadcrumb', href: '/zh-CN/navigation/breadcrumb', name: 'breadcrumb' }, 'with icon'];
</script>

<template>
    <!-- Several breadcrumbs on one page are told apart by aria-label -->
    <div>
        <Breadcrumb aria-label="字符串路由" :routes="['Semi-ui', 'Breadcrumb', 'Default']" />
        <br />
        <Breadcrumb aria-label="带图标的路由" :routes="iconRoutes">
            <template #icon="{ index }">
                <IconHome v-if="index === 0" aria-label="首页" size="small" />
                <IconArticle v-else-if="index === 1" size="small" />
            </template>
        </Breadcrumb>
        <br />
        <Breadcrumb aria-label="长标题路由" :routes="['首页', '当这个页面标题很长时需要省略', '详情页']" />
    </div>
</template>
