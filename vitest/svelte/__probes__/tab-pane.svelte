<script lang="ts">
    import { onDestroy } from 'svelte';
    import { getTabsContext } from './tabs-context.svelte';

    let { title }: { title: string } = $props();

    // registered while the script runs, the earliest point a child can reach its parent
    onDestroy(getTabsContext().register({ title }));
</script>

<div role="tabpanel">{title} panel</div>
