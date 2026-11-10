<script lang="ts">
    import { Avatar, Button, Card, Space, Typography } from '@fibrae/semi-ui-svelte';
</script>

{#snippet title()}
    <Card.Meta title="Semi Doc">
        {#snippet description()}全面、易用、优质{/snippet}
        {#snippet avatar()}
            <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
        {/snippet}
    </Card.Meta>
{/snippet}
{#snippet headerExtraContent()}
    <Typography.Text link>More</Typography.Text>
{/snippet}
{#snippet cover()}
    <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
{/snippet}
{#snippet footer()}
    <Space>
        <Button theme="borderless" type="primary">精选案例</Button>
        <Button theme="solid" type="primary">开始使用</Button>
    </Space>
{/snippet}

<Card {cover} {footer} footerLine footerStyle="display: flex; justify-content: flex-end" {headerExtraContent} style="max-width: 340px" {title}>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。</Card>
