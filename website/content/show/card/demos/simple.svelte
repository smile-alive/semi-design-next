<script lang="ts">
    import { IconInfoCircle } from '@fibrae/semi-icons-svelte';
    import { Avatar, Card, Popover } from '@fibrae/semi-ui-svelte';

    const bodyStyle = 'display: flex; align-items: center; justify-content: space-between';
</script>

{#snippet avatar()}
    <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
{/snippet}
{#snippet content()}
    <article style="padding: 6px">这是一个 Card</article>
{/snippet}

<Card style="max-width: 360px">Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。</Card>
<br />
<Card {bodyStyle} style="max-width: 360px">
    <Card.Meta {avatar} title="Semi Doc" />
    <Popover {content} position="top" showArrow>
        <IconInfoCircle aria-label="信息" style="color: var(--semi-color-primary)" />
    </Popover>
</Card>
