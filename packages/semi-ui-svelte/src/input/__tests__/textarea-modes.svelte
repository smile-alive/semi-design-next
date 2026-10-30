<script lang="ts">
    import TextArea from '../textarea.svelte';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: string; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <TextArea aria-label="field" bind:value={store.value} onChange={(value) => log(`change ${value}`)} />
{:else if mode === 'function'}
    <TextArea
        aria-label="field"
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
    <TextArea aria-label="field" onChange={(value) => log(`change ${value}`)} value={store.value} />
{:else}
    <TextArea aria-label="field" onChange={(value) => log(`change ${value}`)} />
{/if}
