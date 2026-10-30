<script lang="ts">
    import ImagePreview from '../preview.svelte';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    // `visible` and `currentIndex` take the same four writings; `accept` lets the function bindings' setters refuse
    let {
        prop,
        mode,
        src,
        store,
    }: {
        prop: 'visible' | 'currentIndex';
        mode: Mode;
        src: string[];
        store: { visible?: boolean; currentIndex?: number; accept: boolean; log: string[] };
    } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if prop === 'visible'}
    {#if mode === 'bind'}
        <ImagePreview bind:visible={store.visible} onVisibleChange={(value) => log(`visible ${value}`)} {src} />
    {:else if mode === 'function'}
        <ImagePreview
            bind:visible={
                () => store.visible,
                (value) => {
                    log(`set ${value}`);
                    if (store.accept) store.visible = value;
                }
            }
            onVisibleChange={(value) => log(`visible ${value}`)}
            {src}
        />
    {:else if mode === 'one-way'}
        <ImagePreview onVisibleChange={(value) => log(`visible ${value}`)} {src} visible={store.visible} />
    {:else}
        <ImagePreview onVisibleChange={(value) => log(`visible ${value}`)} {src} />
    {/if}
{:else if mode === 'bind'}
    <ImagePreview bind:currentIndex={store.currentIndex} onChange={(value) => log(`change ${value}`)} {src} visible />
{:else if mode === 'function'}
    <ImagePreview
        bind:currentIndex={
            () => store.currentIndex,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.currentIndex = value;
            }
        }
        onChange={(value) => log(`change ${value}`)}
        {src}
        visible
    />
{:else if mode === 'one-way'}
    <ImagePreview currentIndex={store.currentIndex} onChange={(value) => log(`change ${value}`)} {src} visible />
{:else}
    <ImagePreview onChange={(value) => log(`change ${value}`)} {src} visible />
{/if}
