<script lang="ts">
    import { IconTransfer } from '@fibrae/semi-icons-svelte/lab';
    import { Resizable } from '@fibrae/semi-ui-svelte';
</script>

<div style="width: 500px; height: 60%">
    <Resizable defaultSize={{ width: '60%', height: 300 }} style="margin-left: 20%; background-color: var(--semi-grey-1); border: var(--semi-color-border) 1px solid">
        <div style="margin-left: 20%">right</div>
        {#snippet handle({ direction })}
            {#if direction === 'right'}
                <div style="height: 100%; display: flex; align-items: center; width: fit-content">
                    <IconTransfer />
                </div>
            {/if}
        {/snippet}
    </Resizable>
</div>
