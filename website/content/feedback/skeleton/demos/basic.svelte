<script lang="ts">
    import { Avatar, Button, Skeleton, Switch } from '@fibrae/semi-ui-svelte';

    let loading = $state(true);
</script>

<span style="display: flex; align-items: center">
    <Switch aria-labelledby="skeleton-basic-toggle" onChange={() => (loading = !loading)} />
    <span id="skeleton-basic-toggle" style="margin-inline-start: 10px">显示加载内容</span>
</span>
<br />
<Skeleton {loading}>
    {#snippet placeholder()}
        <Skeleton.Avatar />
    {/snippet}
    <Avatar color="blue" style="margin-block-end: 10px">U</Avatar>
</Skeleton>
<br />
<Skeleton {loading} style="width: 200px; height: 150px">
    {#snippet placeholder()}
        <Skeleton.Image />
    {/snippet}
    <img alt="avatar" height="150" src="/assets/placeholder/avatar-a.svg" />
</Skeleton>
<br />
<Skeleton {loading} style="width: 80px">
    {#snippet placeholder()}
        <Skeleton.Title style="margin-block-end: 10px" />
    {/snippet}
    <h4 style="margin-block-end: 0">Semi UI</h4>
</Skeleton>
<Skeleton {loading} style="width: 240px">
    {#snippet placeholder()}
        <Skeleton.Paragraph rows={2} />
    {/snippet}
    <p style="width: 240px">精心打磨每一个组件的用户体验，从用户的角度考虑每个组件的使用场景。</p>
</Skeleton>
<br />
<Skeleton {loading}>
    {#snippet placeholder()}
        <Skeleton.Button />
    {/snippet}
    <Button>Button</Button>
</Skeleton>
