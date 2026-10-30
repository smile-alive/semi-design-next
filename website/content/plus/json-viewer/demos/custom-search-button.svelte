<script lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { Button, JsonViewer } from '@fibrae/semi-ui-svelte';

    const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;
</script>

<div style="margin-bottom: 16px">
    <JsonViewer height={200} value={data} width={700}>
        {#snippet searchButton({ defaultButton, showSearchBar, onToggleSearchBar })}
            <div style="position: absolute; top: 10px; right: 10px; z-index: 10">
                {#if !showSearchBar}
                    <Button onclick={onToggleSearchBar}>
                        {#snippet icon()}
                            <IconSearch />
                        {/snippet}
                        搜索
                    </Button>
                {:else}
                    {@render defaultButton()}
                {/if}
            </div>
        {/snippet}
    </JsonViewer>
</div>
