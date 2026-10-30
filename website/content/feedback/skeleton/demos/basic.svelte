<script lang="ts">
    import { Avatar, Button, Skeleton, SkeletonAvatar, SkeletonButton, SkeletonImage, SkeletonParagraph, SkeletonTitle, Switch } from '@fibrae/semi-ui-svelte';

    let loading = $state(true);
</script>

<span style="display: flex; align-items: center">
    <Switch aria-labelledby="skeleton-basic-toggle" checked={!loading} onChange={() => (loading = !loading)} />
    <span id="skeleton-basic-toggle" style="margin-inline-start: 10px">显示加载内容</span>
</span>
<br />
<Skeleton {loading}>
    {#snippet placeholder()}
        <SkeletonAvatar />
    {/snippet}
    <Avatar color="blue" style="margin-bottom: 10px">U</Avatar>
</Skeleton>
<br />
<Skeleton {loading} style="width: 200px; height: 150px">
    {#snippet placeholder()}
        <SkeletonImage />
    {/snippet}
    <img alt="avatar" height="150" src="/assets/placeholder/avatar-a.svg" />
</Skeleton>
<br />
<Skeleton {loading} style="width: 80px">
    {#snippet placeholder()}
        <SkeletonTitle style="margin-bottom: 10px" />
    {/snippet}
    <h4 style="margin-bottom: 0">Semi UI</h4>
</Skeleton>
<Skeleton {loading} style="width: 240px">
    {#snippet placeholder()}
        <SkeletonParagraph rows={2} />
    {/snippet}
    <p style="width: 240px">精心打磨每一个组件的用户体验，从用户的角度考虑每个组件的使用场景。</p>
</Skeleton>
<br />
<Skeleton {loading}>
    {#snippet placeholder()}
        <SkeletonButton />
    {/snippet}
    <Button>Button</Button>
</Skeleton>
