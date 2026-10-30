<script lang="ts">
    import type { Snippet } from 'svelte';
    import { getNavContext } from './context.js';
    import type { NavWrapperArgs } from './interface.js';

    // Hands the item's li to the Nav's `wrapper` snippet when there is one; otherwise the li renders as it is
    let { itemElement, isSubNav, isInSubNav, itemProps }: { itemElement: Snippet; isSubNav: boolean; isInSubNav: boolean; itemProps: NavWrapperArgs['props'] } = $props();

    const ctx = getNavContext('Nav.Item');

    const wrapper = $derived(ctx.wrapper);
</script>

{#if wrapper}
    {@render wrapper({ itemElement, isSubNav, isInSubNav, props: itemProps })}
{:else}
    {@render itemElement()}
{/if}
