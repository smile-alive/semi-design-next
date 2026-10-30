<script lang="ts">
    import { Avatar, Skeleton, SkeletonAvatar, SkeletonParagraph, SkeletonTitle } from '@fibrae/semi-ui-svelte';

    const style = 'display: flex; align-items: flex-start';
</script>

<Skeleton loading>
    {#snippet placeholder()}
        <div {style}>
            <SkeletonAvatar style="margin-inline-end: 12px" />
            <div>
                <SkeletonTitle style="width: 120px; margin-bottom: 12px; margin-top: 12px" />
                <SkeletonParagraph rows={3} style="width: 240px" />
            </div>
        </div>
    {/snippet}
    <div {style}>
        <Avatar color="blue" style="margin-inline-end: 12px">UI</Avatar>
        <div>
            <h3>Semi UI</h3>
            <p>Hi, Bytedance dance dance.</p>
            <p>Hi, Bytedance dance dance.</p>
            <p>Hi, Bytedance dance dance.</p>
        </div>
    </div>
</Skeleton>
