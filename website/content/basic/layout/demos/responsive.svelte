<script lang="ts">
    import { Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutSider } from '@fibrae/semi-ui-svelte';

    const commonStyle = 'height: 64px; line-height: 64px; background: var(--semi-color-fill-0)';
</script>

<Layout class="components-layout-demo">
    <LayoutHeader style={commonStyle}>Header</LayoutHeader>
    <Layout>
        <LayoutSider breakpoint={['md']} onBreakpoint={(screen, matches) => console.log(screen, matches)} style="width: 120px; background: var(--semi-color-fill-2)">Sider</LayoutSider>
        <LayoutContent style="height: 300px; line-height: 300px">Content</LayoutContent>
    </Layout>
    <LayoutFooter style={commonStyle}>Footer</LayoutFooter>
</Layout>
