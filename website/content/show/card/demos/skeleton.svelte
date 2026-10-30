<script lang="ts">
    import { Avatar, Card, CardMeta, Skeleton, SkeletonAvatar, SkeletonImage, SkeletonParagraph, SkeletonTitle, Switch, TypographyText, TypographyTitle } from '@fibrae/semi-ui-svelte';

    let loading = $state(true);
</script>

{#snippet title()}
    <CardMeta>
        {#snippet title()}
            <Skeleton {loading} style="width: 80px">
                {#snippet placeholder()}<SkeletonTitle />{/snippet}
                <TypographyTitle heading={5}>Semi Doc</TypographyTitle>
            </Skeleton>
        {/snippet}
        {#snippet description()}
            <Skeleton {loading} style="width: 150px; margin-top: 12px">
                {#snippet placeholder()}<SkeletonParagraph rows={1} />{/snippet}
                <TypographyText>全面、易用、优质</TypographyText>
            </Skeleton>
        {/snippet}
        {#snippet avatar()}
            <Skeleton {loading}>
                {#snippet placeholder()}<SkeletonAvatar />{/snippet}
                <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
            </Skeleton>
        {/snippet}
    </CardMeta>
{/snippet}
{#snippet headerExtraContent()}
    <Skeleton {loading} style="width: 50px">
        {#snippet placeholder()}<SkeletonParagraph rows={1} />{/snippet}
        <TypographyText link>More</TypographyText>
    </Skeleton>
{/snippet}
{#snippet cover()}
    <Skeleton {loading} style="max-width: 100%; height: 220px">
        {#snippet placeholder()}<SkeletonImage />{/snippet}
        <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
    </Skeleton>
{/snippet}

<Switch aria-label="显示内容" onChange={(v) => (loading = !v)} />
<br />
<br />
<Card {cover} {headerExtraContent} style="max-width: 300px" {title} />
