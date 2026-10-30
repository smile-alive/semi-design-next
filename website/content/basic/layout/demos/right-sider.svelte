<script lang="ts">
    import { Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutSider } from '@fibrae/semi-ui-svelte';

    const commonStyle = 'height: 64px; line-height: 64px; background: var(--semi-color-fill-0)';
</script>

<Layout class="components-layout-demo">
    <LayoutHeader style={commonStyle}>Header</LayoutHeader>
    <Layout>
        <LayoutContent style="height: 300px; line-height: 300px">Content</LayoutContent>
        <LayoutSider style="width: 120px; background: var(--semi-color-fill-2)">Sider</LayoutSider>
    </Layout>
    <LayoutFooter style={commonStyle}>Footer</LayoutFooter>
</Layout>
