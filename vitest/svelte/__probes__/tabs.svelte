<script lang="ts">
    import type { Snippet } from 'svelte';
    import { type PaneEntry, setTabsContext } from './tabs-context.svelte';

    let { children }: { children: Snippet } = $props();

    const panes: PaneEntry[] = $state([]);

    setTabsContext({
        register: (pane) => {
            panes.push(pane);
            return () => panes.splice(panes.indexOf(pane), 1);
        },
    });
</script>

<div data-snippet-keys={Object.keys(children).join(',')} data-snippet-type={typeof children} role="tablist">
    {#each panes as pane (pane)}
        <button role="tab" type="button">{pane.title}</button>
    {/each}
</div>
{@render children()}
