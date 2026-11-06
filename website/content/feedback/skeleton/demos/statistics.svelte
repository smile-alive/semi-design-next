<script lang="ts">
    import { Descriptions, Skeleton } from '@fibrae/semi-ui-svelte';

    const data = [{ key: '实际用户数量', value: '1,480,000' }];
</script>

<Skeleton loading>
    {#snippet placeholder()}
        <div>
            <Skeleton.Paragraph rows={1} style="width: 80px; margin-block-end: 10px" />
            <Skeleton.Title style="width: 120px" />
        </div>
    {/snippet}
    <Descriptions {data} row />
</Skeleton>
