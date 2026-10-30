<script lang="ts">
    import Input from '../input.svelte';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: string; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <Input aria-label="field" bind:value={store.value} onChange={(value) => log(`change ${value}`)} />
{:else if mode === 'function'}
    <Input
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
    <Input aria-label="field" onChange={(value) => log(`change ${value}`)} value={store.value} />
{:else}
    <Input aria-label="field" onChange={(value) => log(`change ${value}`)} />
{/if}
