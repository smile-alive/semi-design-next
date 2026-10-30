<script lang="ts">
    import { IconArticle, IconHome } from '@fibrae/semi-icons-svelte';
    import { Breadcrumb, type BreadcrumbRoute } from '@fibrae/semi-ui-svelte';

    const iconRoutes: (BreadcrumbRoute | string)[] = [{ path: '/', href: '/' }, { path: '/breadcrumb', href: '/zh-CN/navigation/breadcrumb', name: 'breadcrumb' }, 'with icon'];
</script>

<!-- Several breadcrumbs on one page are told apart by aria-label -->
<div>
    <Breadcrumb aria-label="字符串路由" routes={['Semi-ui', 'Breadcrumb', 'Default']} />
    <br />
    <Breadcrumb aria-label="带图标的路由" routes={iconRoutes}>
        {#snippet icon({ class: className, index, size })}
            {#if index === 0}
                <IconHome aria-label="首页" class={className} {size} />
            {:else if index === 1}
                <IconArticle class={className} {size} />
            {/if}
        {/snippet}
    </Breadcrumb>
    <br />
    <Breadcrumb aria-label="长标题路由" routes={['首页', '当这个页面标题很长时需要省略', '详情页']} />
</div>
