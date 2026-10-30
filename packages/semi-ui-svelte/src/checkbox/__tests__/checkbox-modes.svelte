<script lang="ts">
    import Checkbox from '../checkbox.svelte';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: boolean; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <Checkbox bind:checked={store.value} onChange={(event) => log(`change ${event.target.checked}`)}>label</Checkbox>
{:else if mode === 'function'}
    <Checkbox
        bind:checked={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        onChange={(event) => log(`change ${event.target.checked}`)}
    >
        label
    </Checkbox>
{:else if mode === 'one-way'}
    <Checkbox checked={store.value} onChange={(event) => log(`change ${event.target.checked}`)}>label</Checkbox>
{:else}
    <Checkbox onChange={(event) => log(`change ${event.target.checked}`)}>label</Checkbox>
{/if}
