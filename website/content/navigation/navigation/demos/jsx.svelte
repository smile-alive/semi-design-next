<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconBadge, IconForm, IconTree } from '@fibrae/semi-icons-svelte/lab';
    import { Nav } from '@fibrae/semi-ui-svelte';
</script>

{#snippet header()}
    <Nav.Header text="Semi 运营后台">
        {#snippet logo()}
            <IconSemiLogo style="height: 36px; font-size: 36px" />
        {/snippet}
    </Nav.Header>
{/snippet}

{#snippet footer()}
    <Nav.Footer collapseButton />
{/snippet}

<Nav {footer} {header} onClick={(data) => console.log('trigger onClick: ', data)} onSelect={(data) => console.log('trigger onSelect: ', data)} openKeys={['user']} styles={{ body: 'height: 300px' }}>
    <Nav.Item itemKey="union" text="活动管理">
        {#snippet icon(renderProps)}
            <IconForm size={renderProps.size} />
        {/snippet}
    </Nav.Item>
    <Nav.Sub itemKey="user" text="用户管理">
        {#snippet icon(renderProps)}
            <IconBadge size={renderProps.size} />
        {/snippet}
        <Nav.Item itemKey="active" text="活跃用户" />
        <Nav.Item itemKey="negative" text="非活跃用户" />
    </Nav.Sub>
    <Nav.Sub itemKey="union-management" text="任务管理">
        {#snippet icon(renderProps)}
            <IconTree size={renderProps.size} />
        {/snippet}
        <Nav.Item itemKey="notice" text="任务设置" />
        <Nav.Item itemKey="query" text="任务查询" />
        <Nav.Item itemKey="info" text="信息录入" />
    </Nav.Sub>
</Nav>
