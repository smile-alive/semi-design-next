<script lang="ts">
    import Switch from '../switch.svelte';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: boolean; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <Switch bind:checked={store.value} onChange={(value) => log(`change ${value}`)} />
{:else if mode === 'function'}
    <Switch
        bind:checked={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        onChange={(value) => log(`change ${value}`)}
    />
{:else if mode === 'one-way'}
    <Switch checked={store.value} onChange={(value) => log(`change ${value}`)} />
{:else}
    <Switch onChange={(value) => log(`change ${value}`)} />
{/if}
