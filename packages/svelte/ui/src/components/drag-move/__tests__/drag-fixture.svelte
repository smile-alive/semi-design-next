<script lang="ts">
    import dragMove from '../drag-move';
    import type { DragMoveOptions } from '../interface';

    type Variant = 'plain' | 'inputs' | 'handler' | 'swap-handler';

    let { store }: { store: { options: DragMoveOptions; show: boolean; second: boolean; variant: Variant } } = $props();

    let handle = $state(1);
    let handlerNode = $state<HTMLElement>();
</script>

<div data-testid="box">
    {#if store.show}
        {#if store.variant === 'inputs'}
            <div {@attach dragMove(store.options)} data-testid="drag">
                <input aria-label="name" />
                <textarea aria-label="note"></textarea>
            </div>
        {:else if store.variant === 'handler'}
            <div {@attach dragMove({ ...store.options, handler: () => handlerNode ?? null })} data-testid="drag">
                <div bind:this={handlerNode}>Handle</div>
                <div>Body</div>
            </div>
        {:else if store.variant === 'swap-handler'}
            <div {@attach dragMove({ ...store.options, handler: () => document.querySelector<HTMLElement>('[data-testid="handle"]') })} data-testid="drag">
                {#key handle}
                    <div data-testid="handle">Handle {handle}</div>
                {/key}
                <button type="button" onclick={() => handle++}>swap</button>
            </div>
        {:else if store.second}
            <div {@attach dragMove(store.options)}>Second</div>
        {:else}
            <div {@attach dragMove(store.options)}>Drag me</div>
        {/if}
    {/if}
</div>
