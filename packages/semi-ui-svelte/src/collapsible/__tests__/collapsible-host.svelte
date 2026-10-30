<script lang="ts">
    import Collapsible from '../collapsible.svelte';
    import type { CollapsibleProps } from '../interface';

    // the test drives every prop through one store, so a change flows in as a prop update
    let { store }: { store: CollapsibleProps & { text?: string; height?: string; inside?: boolean; log?: string[] } } = $props();
</script>

<Collapsible
    class={store.class}
    collapseHeight={store.collapseHeight}
    collapseHeightAdaptive={store.collapseHeightAdaptive}
    duration={store.duration}
    fade={store.fade}
    id={store.id}
    isOpen={store.isOpen}
    keepDOM={store.keepDOM}
    lazyRender={store.lazyRender}
    motion={store.motion}
    onMotionEnd={() => store.log?.push('motionEnd')}
    style={store.style}
    title={store.title}
    ontransitionend={() => store.log?.push('transitionend')}
>
    {#if store.inside}
        <button type="button">inside</button>
    {:else}
        <div data-testid="content" style:height={store.height}>{store.text ?? 'hello'}</div>
    {/if}
</Collapsible>
