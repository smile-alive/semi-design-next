<script lang="ts">
    import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from '@fibrae/semi-ui-svelte';

    const commonStyle = 'height: 64px; line-height: 64px; background: var(--semi-color-fill-0)';
</script>

<Layout class="components-layout-demo">
    <LayoutHeader style={commonStyle}>Header</LayoutHeader>
    <LayoutContent style="height: 300px; line-height: 300px">Content</LayoutContent>
    <LayoutFooter style={commonStyle}>Footer</LayoutFooter>
</Layout>
