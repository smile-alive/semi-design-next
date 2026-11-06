<script lang="ts">
    import { Avatar, Skeleton } from '@fibrae/semi-ui-svelte';
</script>

<Skeleton loading>
    {#snippet placeholder()}
        <div style="display: flex; align-items: center">
            <Skeleton.Avatar style="margin-inline-end: 12px" />
            <Skeleton.Title style="width: 120px" />
        </div>
    {/snippet}
    <Avatar color="blue" style="margin-inline-end: 12px">UI</Avatar>
    <span>Semi UI</span>
</Skeleton>
