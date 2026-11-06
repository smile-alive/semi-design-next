<script lang="ts">
    import { Avatar, Card, Skeleton, Switch, Typography } from '@fibrae/semi-ui-svelte';

    let loading = $state(true);
</script>

{#snippet title()}
    <Card.Meta>
        {#snippet title()}
            <Skeleton {loading} style="width: 80px">
                {#snippet placeholder()}<Skeleton.Title />{/snippet}
                <Typography.Title heading={5}>Semi Doc</Typography.Title>
            </Skeleton>
        {/snippet}
        {#snippet description()}
            <Skeleton {loading} style="width: 150px; margin-top: 12px">
                {#snippet placeholder()}<Skeleton.Paragraph rows={1} />{/snippet}
                <Typography.Text>全面、易用、优质</Typography.Text>
            </Skeleton>
        {/snippet}
        {#snippet avatar()}
            <Skeleton {loading}>
                {#snippet placeholder()}<Skeleton.Avatar />{/snippet}
                <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
            </Skeleton>
        {/snippet}
    </Card.Meta>
{/snippet}
{#snippet headerExtraContent()}
    <Skeleton {loading} style="width: 50px">
        {#snippet placeholder()}<Skeleton.Paragraph rows={1} />{/snippet}
        <Typography.Text link>More</Typography.Text>
    </Skeleton>
{/snippet}
{#snippet cover()}
    <Skeleton {loading} style="max-width: 100%; height: 220px">
        {#snippet placeholder()}<Skeleton.Image />{/snippet}
        <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
    </Skeleton>
{/snippet}

<Switch aria-label="显示内容" onChange={(v) => (loading = !v)} />
<br />
<br />
<Card {cover} {headerExtraContent} style="max-width: 300px" {title} />
