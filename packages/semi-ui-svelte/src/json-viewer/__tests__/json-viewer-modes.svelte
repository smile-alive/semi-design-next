<script lang="ts">
    import JsonViewer from '../json-viewer.svelte';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: string; accept: boolean; log: string[]; renders: number } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <JsonViewer bind:value={store.value} onChange={(value) => log(`change ${value}`)} />
{:else if mode === 'function'}
    <JsonViewer
        bind:value={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        onChange={(value) => log(`change ${value}`)}
    />
{:else if mode === 'one-way'}
    <JsonViewer onChange={(value) => log(`change ${value}`)} value={store.value} />
{:else}
    <JsonViewer onChange={(value) => log(`change ${value}`)} />
{/if}
<output aria-label="text">{store.value}</output>
<button type="button" onclick={() => store.renders++}>render {store.renders}</button>
