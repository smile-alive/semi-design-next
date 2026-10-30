<script lang="ts">
    import { Skeleton, SkeletonAvatar, SkeletonParagraph, SkeletonTitle } from '../index';
    import type { SkeletonProps } from '../interface';

    let { store, ...attrs }: { store: { loading?: boolean; active?: boolean } } & SkeletonProps = $props();
</script>

<Skeleton {...attrs} active={store.active} loading={store.loading}>
    {#snippet placeholder()}
        <SkeletonAvatar />
        <SkeletonTitle />
        <SkeletonParagraph />
    {/snippet}
    <div>content</div>
</Skeleton>
