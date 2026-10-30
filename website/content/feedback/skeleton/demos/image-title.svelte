<script lang="ts">
    import { Skeleton, SkeletonImage, SkeletonTitle } from '@fibrae/semi-ui-svelte';
</script>

<Skeleton loading>
    {#snippet placeholder()}
        <div>
            <SkeletonImage style="width: 200px; height: 150px" />
            <SkeletonTitle style="width: 120px; margin-top: 10px" />
        </div>
    {/snippet}
    <img alt="avatar" height="150" src="/assets/placeholder/avatar-a.svg" />
    <h4>Semi UI</h4>
</Skeleton>
