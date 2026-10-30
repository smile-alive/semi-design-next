<script lang="ts">
    import { Descriptions, Skeleton, SkeletonParagraph, SkeletonTitle } from '@fibrae/semi-ui-svelte';

    const data = [{ key: '实际用户数量', value: '1,480,000' }];
</script>

<Skeleton loading>
    {#snippet placeholder()}
        <div>
            <SkeletonParagraph rows={1} style="width: 80px; margin-bottom: 10px" />
            <SkeletonTitle style="width: 120px" />
        </div>
    {/snippet}
    <Descriptions {data} row />
</Skeleton>
