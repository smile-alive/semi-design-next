<script lang="ts">
    import { ResizeGroup, ResizeHandler, ResizeItem } from '..';

    let { ids }: { ids: string[] } = $props();
</script>

<div style="width: 1010px; height: 500px">
    <ResizeGroup>
        {#each ids as id, i (id)}
            {#if i > 0}
                <ResizeHandler />
            {/if}
            <ResizeItem>{id}</ResizeItem>
        {/each}
    </ResizeGroup>
</div>
