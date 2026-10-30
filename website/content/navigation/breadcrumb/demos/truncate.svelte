<script lang="ts">
    import { Breadcrumb, TypographyText } from '@fibrae/semi-ui-svelte';

    const routes = ['首页', '当这个页面标题很长很长很长时需要省略', '详情页'];
</script>

<!-- Several breadcrumbs on one page are told apart by aria-label -->
<div>
    <TypographyText size="small">默认行为</TypographyText>
    <Breadcrumb aria-label="默认行为" {routes} />
    <br />
    <TypographyText size="small">省略但不显示Tooltip</TypographyText>
    <Breadcrumb aria-label="省略但不显示Tooltip" {routes} showTooltip={false} />
    <br />
    <TypographyText size="small">不截断</TypographyText>
    <Breadcrumb aria-label="不截断" {routes} showTooltip={{ width: 'auto' }} />
    <br />
    <TypographyText size="small">从标题中间开始省略</TypographyText>
    <Breadcrumb aria-label="从标题中间开始省略" {routes} showTooltip={{ ellipsisPos: 'middle' }} />
    <br />
    <TypographyText size="small">自定义 Tooltip 参数</TypographyText>
    <Breadcrumb aria-label="自定义 Tooltip 参数" {routes} showTooltip={{ opts: { position: 'topLeft' } }} />
</div>
