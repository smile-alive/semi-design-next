<script lang="ts">
    import { Button, Skeleton, SkeletonButton, SkeletonParagraph } from '@fibrae/semi-ui-svelte';

    const style = 'display: flex; flex-direction: column; align-items: center; width: 300px; margin-bottom: 10px';
</script>

<Skeleton loading style="text-align: center">
    {#snippet placeholder()}
        <div {style}>
            <SkeletonParagraph rows={3} {style} />
            <SkeletonButton />
        </div>
    {/snippet}
    <div style="text-align: center">
        <p>Hi, Bytedance dance dance.</p>
        <p>Hi, Bytedance dance dance.</p>
        <Button>Button</Button>
    </div>
</Skeleton>
