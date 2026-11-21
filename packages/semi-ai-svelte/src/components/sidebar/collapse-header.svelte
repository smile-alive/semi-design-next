<script lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
    import { IconCodeStroked, IconFile } from '@fibrae/semi-icons-svelte';

    let { mode, name, class: className, style }: { mode: 'code' | 'file'; name?: string; class?: ClassValue; style?: string } = $props();

    const collapseCls = cssClasses.COLLAPSE;
</script>

<!-- Inside Collapse's toggle button: phrasing content only, no controls -->
<span class={[`${collapseCls}-header-content`, className]} {style}>
    {#if mode === 'code'}<IconCodeStroked />{:else}<IconFile />{/if}
    <span class={`${collapseCls}-header-text`}>{name}</span>
</span>
