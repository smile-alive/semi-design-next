<script lang="ts">
    import Badge from '../badge.svelte';
    import type { BadgeProps } from '../interface';

    let { store = {}, custom = false, withChild = true }: { store?: BadgeProps; custom?: boolean; withChild?: boolean } = $props();
</script>

{#snippet icon()}
    <i data-testid="icon"></i>
{/snippet}

{#if custom}
    <Badge count={icon} theme="light" type="danger">
        <span>Semi</span>
    </Badge>
{:else if withChild}
    <Badge {...store}><span>Semi</span></Badge>
{:else}
    <Badge {...store} />
{/if}
