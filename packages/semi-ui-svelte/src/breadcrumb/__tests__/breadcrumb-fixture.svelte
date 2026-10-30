<script lang="ts">
    import { IconArticle, IconHome } from '@fibrae/semi-icons-svelte';
    import Breadcrumb from '../breadcrumb.svelte';
    import type { BreadcrumbIconContext, BreadcrumbProps } from '../interface';

    interface Store {
        props?: BreadcrumbProps;
        // which snippets to pass
        icon?: boolean;
        item?: boolean;
        more?: boolean;
        separator?: boolean;
    }

    let { store }: { store: Store } = $props();
</script>

{#snippet icon({ route, size, class: className }: BreadcrumbIconContext)}
    {#if route.path === '/'}<IconHome class={className} {size} />{:else if route.path}<IconArticle class={className} {size} />{/if}
{/snippet}

{#snippet item({ route, index }: { route: { name?: string; path?: string; href?: string }; index: number })}
    <i class="path">{route.path}</i><i class="href">{route.href}</i><i class="name">{`${route.name}-${index}`}</i>
{/snippet}

{#snippet more({ restItems }: { restItems: { route: { name?: string }; index: number }[] })}
    <span class="custom-more">{restItems.length}:{restItems.map(({ route }) => route.name).join(',')}</span>
{/snippet}

{#snippet separator()}<b class="sep">|</b>{/snippet}

<Breadcrumb {...store.props} icon={store.icon ? icon : undefined} item={store.item ? item : undefined} more={store.more ? more : undefined} separator={store.separator ? separator : store.props?.separator} />
