<script lang="ts">
    import { Banner, Button, Layout } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const toggle = () => {
        visible = !visible;
    };

    const commonStyle = 'height: 64px; line-height: 64px; background: var(--semi-color-fill-0)';
</script>

<Layout class="components-layout-demo banner-basic">
    <Layout.Header style={commonStyle}>Header</Layout.Header>
    {#if visible}
        <Banner onClose={toggle}>
            {#snippet description()}一套组件，四个框架原生可用，随时查阅对应的前端代码{/snippet}
        </Banner>
    {/if}
    <Layout.Content style="height: 300px; line-height: 300px">Content</Layout.Content>
    <Layout.Footer style={commonStyle}>Footer</Layout.Footer>
</Layout>
<Button style="display: block; width: 120px; margin: 0 auto" onclick={toggle}>
    {visible ? 'Hide Banner' : 'Show Banner'}
</Button>
