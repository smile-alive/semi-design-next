<script setup lang="ts">
    import { Breadcrumb, Typography } from '@fibrae/semi-ui-vue';

    const routes = ['首页', '当这个页面标题很长很长很长时需要省略', '详情页'];
</script>

<template>
    <!-- Several breadcrumbs on one page are told apart by aria-label -->
    <div>
        <Typography.Text size="small">默认行为</Typography.Text>
        <Breadcrumb aria-label="默认行为" :routes="routes" />
        <br />
        <Typography.Text size="small">省略但不显示Tooltip</Typography.Text>
        <Breadcrumb aria-label="省略但不显示Tooltip" :routes="routes" :showTooltip="false" />
        <br />
        <Typography.Text size="small">不截断</Typography.Text>
        <Breadcrumb aria-label="不截断" :routes="routes" :showTooltip="{ width: 'auto' }" />
        <br />
        <Typography.Text size="small">从标题中间开始省略</Typography.Text>
        <Breadcrumb aria-label="从标题中间开始省略" :routes="routes" :showTooltip="{ ellipsisPos: 'middle' }" />
        <br />
        <Typography.Text size="small">自定义 Tooltip 参数</Typography.Text>
        <Breadcrumb aria-label="自定义 Tooltip 参数" :routes="routes" :showTooltip="{ opts: { position: 'topLeft' } }" />
    </div>
</template>
