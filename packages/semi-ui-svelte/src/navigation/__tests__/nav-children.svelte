<script lang="ts">
    import { IconHome } from '@fibrae/semi-icons-svelte';
    import type { NavProps } from '../interface';
    import NavFooter from '../nav-footer.svelte';
    import NavHeader from '../nav-header.svelte';
    import NavItem from '../nav-item.svelte';
    import Nav from '../nav.svelte';
    import SubNav from '../sub-nav.svelte';

    // Nav.Item and Nav.Sub written as children; header and footer are snippets that hold NavHeader and NavFooter
    let { props = {}, header = true, footer = false }: { props?: NavProps; header?: boolean; footer?: boolean } = $props();
</script>

{#snippet headerContent()}
    <NavHeader link="/home" text="Semi 运营后台">
        {#snippet logo()}
            <span data-testid="logo">logo</span>
        {/snippet}
    </NavHeader>
{/snippet}

{#snippet footerContent()}
    <NavFooter collapseButton />
{/snippet}

<Nav {...props} footer={footer ? footerContent : undefined} header={header ? headerContent : undefined}>
    <NavItem itemKey="home" text="首页">
        {#snippet icon({ size })}
            <IconHome {size} />
        {/snippet}
    </NavItem>
    <SubNav itemKey="user" text="用户">
        <NavItem itemKey="list" text="用户列表" />
        <NavItem itemKey="ban" text="用户封禁" />
        <SubNav itemKey="deep" text="更多">
            <NavItem itemKey="leaf" text="叶子" />
        </SubNav>
    </SubNav>
    <NavItem itemKey="docs" link="#docs" text="文档" />
</Nav>
