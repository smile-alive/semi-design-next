<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { IconCodeStroked, IconFile } from '@fibrae/semi-icons-svelte';

    let { mode, name }: { mode: 'code' | 'file'; name?: string } = $props();

    const collapseCls = cssClasses.COLLAPSE;
</script>

<!-- Inside Collapse's toggle button: phrasing content only, no controls -->
<span class={`${collapseCls}-header-content`}>
    {#if mode === 'code'}<IconCodeStroked />{:else}<IconFile />{/if}
    <span class={`${collapseCls}-header-text`}>{name}</span>
</span>
