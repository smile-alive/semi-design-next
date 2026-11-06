<script lang="ts">
    import { IconMore } from '@fibrae/semi-icons-svelte';
    import { Breadcrumb, Popover, type BreadcrumbRoute } from '@fibrae/semi-ui-svelte';

    const separator = '-';
    const onClick = (route: BreadcrumbRoute, event: MouseEvent) => console.log(route, event);
</script>

<Breadcrumb {onClick} routes={['首页', '当层级很多的时候', '又一层', '再一层', '上上一层', '上一层', '详情页']}>
    {#snippet more(moreContext)}
        <Popover showArrow style="padding: 12px">
            {#snippet child({ props })}<IconMore {...props} tabindex={-1} />{/snippet}
            {#snippet content()}
                {#each moreContext.restItems as item, i (item.index)}
                    <span>{item.route.name}</span>
                    {#if i < moreContext.restItems.length - 1}
                        <span style="color: var(--semi-color-text-2); margin-inline-end: 6px">{separator}</span>
                    {/if}
                {/each}
            {/snippet}
        </Popover>
    {/snippet}
</Breadcrumb>
