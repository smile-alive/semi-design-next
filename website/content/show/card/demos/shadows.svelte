<script lang="ts">
    import { IconInfoCircle } from '@fibrae/semi-icons-svelte';
    import { Avatar, Card, CardMeta, Popover } from '@fibrae/semi-ui-svelte';

    const bodyStyle = 'display: flex; align-items: center; justify-content: space-between';
</script>

{#snippet avatar()}
    <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
{/snippet}
{#snippet content()}
    <article style="padding: 6px">这是一个 Card</article>
{/snippet}

<div>
    <Card {bodyStyle} shadows="hover" style="max-width: 360px">
        <CardMeta {avatar} title="Semi Doc" />
        <Popover {content} position="top" showArrow>
            <IconInfoCircle aria-label="信息" style="color: var(--semi-color-primary)" />
        </Popover>
    </Card>
    <br />
    <Card {bodyStyle} shadows="always" style="max-width: 360px">
        <CardMeta {avatar} title="Semi Doc" />
        <Popover {content} position="top" showArrow>
            <IconInfoCircle aria-label="信息" style="color: var(--semi-color-primary)" />
        </Popover>
    </Card>
</div>
