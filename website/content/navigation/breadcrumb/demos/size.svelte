<script lang="ts">
    import { IconHome } from '@fibrae/semi-icons-svelte';
    import { Breadcrumb, type BreadcrumbIconContext } from '@fibrae/semi-ui-svelte';

    const routes = ['', 'Breadcrumb', 'Loose'];
</script>

{#snippet icon({ class: className, index, size }: BreadcrumbIconContext)}
    {#if index === 0}
        <IconHome aria-label="Home" class={className} {size} />
    {/if}
{/snippet}

<!-- Several breadcrumbs on one page are told apart by aria-label -->
<div>
    <Breadcrumb aria-label="紧凑面包屑" compact {icon} {routes} />
    <br />
    <Breadcrumb aria-label="宽松面包屑" compact={false} {icon} {routes} />
</div>
