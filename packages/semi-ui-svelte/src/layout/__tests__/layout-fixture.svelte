<script lang="ts">
    import Content from '../content.svelte';
    import Footer from '../footer.svelte';
    import Header from '../header.svelte';
    import type { LayoutProps } from '../interface';
    import Layout from '../layout.svelte';
    import Sider from '../sider.svelte';

    // `sider` places a Sider directly under the root, nested in a div, or inside an inner Layout
    let { store }: { store: { props: LayoutProps; sider?: 'direct' | 'deep' | 'nested' | 'none'; parts?: boolean } } = $props();
</script>

<Layout {...store.props}>
    {#if store.parts}
        <Header data-testid="header" role="toolbar">h</Header>
        <Content data-testid="content">c</Content>
        <Footer data-testid="footer">f</Footer>
    {/if}
    {#if store.sider === 'direct'}
        <Sider />
    {:else if store.sider === 'deep'}
        <div><Sider /></div>
    {:else if store.sider === 'nested'}
        <Layout class="inner"><div><Sider /></div></Layout>
    {/if}
</Layout>
