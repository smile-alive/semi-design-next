<script lang="ts">
    import Collapse from '../collapse.svelte';
    import CollapsePanel from '../panel.svelte';

    let { variant }: { variant: 'motion-end' | 'extra-button' | 'extra-input' | 'element-header' | 'empty' } = $props();

    let changes = $state(0);
    let ends = $state(0);
</script>

<Collapse clickHeaderToExpand={variant === 'empty' || variant === 'extra-input'} expandIconPosition={variant === 'element-header' ? 'left' : 'right'} onChange={() => (changes += 1)}>
    {#if variant === 'motion-end'}
        <CollapsePanel itemKey="1" onMotionEnd={() => (ends += 1)}>
            {#snippet header()}title{/snippet}
            content
        </CollapsePanel>
    {:else if variant === 'extra-button'}
        <CollapsePanel itemKey="1">
            {#snippet header()}title{/snippet}
            {#snippet extra()}<button type="button">copy</button>{/snippet}
            content
        </CollapsePanel>
    {:else if variant === 'extra-input'}
        <CollapsePanel itemKey="1">
            {#snippet header()}title{/snippet}
            {#snippet extra()}<input aria-label="inner" />{/snippet}
            one
        </CollapsePanel>
    {:else if variant === 'element-header'}
        <CollapsePanel itemKey="1">
            {#snippet header()}<b data-testid="node">node header</b>{/snippet}
            {#snippet extra()}more{/snippet}
            content
        </CollapsePanel>
    {:else}
        <CollapsePanel itemKey="1">
            {#snippet header()}empty{/snippet}
        </CollapsePanel>
    {/if}
</Collapse>
<output aria-label="changes">{changes}</output>
<output aria-label="ends">{ends}</output>
