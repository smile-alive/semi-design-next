<script lang="ts">
    import { Skeleton } from '@fibrae/semi-ui-svelte';
</script>

<Skeleton loading>
    {#snippet placeholder()}
        <div>
            <Skeleton.Image style="width: 200px; height: 150px" />
            <Skeleton.Title style="width: 120px; margin-block-start: 10px" />
        </div>
    {/snippet}
    <img alt="avatar" height="150" src="/assets/placeholder/avatar-a.svg" />
    <h4>Semi UI</h4>
</Skeleton>
