<script lang="ts">
    import { Avatar, Button, Card, CardMeta, Space, TypographyText } from '@fibrae/semi-ui-svelte';
</script>

{#snippet title()}
    <CardMeta title="Semi Doc">
        {#snippet description()}全面、易用、优质{/snippet}
        {#snippet avatar()}
            <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
        {/snippet}
    </CardMeta>
{/snippet}
{#snippet headerExtraContent()}
    <TypographyText link>More</TypographyText>
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

<Card {cover} {footer} footerLine footerStyle="display: flex; justify-content: flex-end" {headerExtraContent} style="max-width: 340px" {title}>Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。</Card>
