<script lang="ts">
    import type { NavFooterProps, NavHeaderProps, NavItemProps, NavProps, SubNavProps } from '../interface';
    import NavFooter from '../nav-footer.svelte';
    import NavHeader from '../nav-header.svelte';
    import NavItem from '../nav-item.svelte';
    import Nav from '../nav.svelte';
    import SubNav from '../sub-nav.svelte';

    let { nav = {}, header = {}, item = {}, sub = {}, footer = {} }: { nav?: NavProps; header?: NavHeaderProps; item?: NavItemProps; sub?: SubNavProps; footer?: NavFooterProps } = $props();
</script>

{#snippet headerContent()}
    <NavHeader {...header} link="#" text="T">
        {#snippet logo()}L{/snippet}
    </NavHeader>
{/snippet}

{#snippet footerContent()}
    <NavFooter {...footer} collapseButton />
{/snippet}

<Nav {...nav} footer={footerContent} header={headerContent} openKeys={['sub']} subNavMotion={false}>
    <NavItem {...item} itemKey="leaf" text="Leaf">
        {#snippet icon()}<span></span>{/snippet}
        {#snippet toggleIcon()}<span></span>{/snippet}
    </NavItem>
    <SubNav {...sub} itemKey="sub" text="Sub">
        {#snippet icon()}<span></span>{/snippet}
        <NavItem itemKey="child" text="Child" />
    </SubNav>
</Nav>
