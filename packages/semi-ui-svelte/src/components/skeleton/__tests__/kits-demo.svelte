<script lang="ts">
    import { Skeleton, SkeletonAvatar, SkeletonButton, SkeletonImage, SkeletonTitle } from '../index';
</script>

<Skeleton>
    {#snippet placeholder()}
        <SkeletonAvatar type={undefined} />
        <SkeletonImage type={undefined} />
        <SkeletonTitle type={undefined} />
        <SkeletonButton type={undefined} />
        <SkeletonTitle aria-hidden="false" />
    {/snippet}
</Skeleton>
