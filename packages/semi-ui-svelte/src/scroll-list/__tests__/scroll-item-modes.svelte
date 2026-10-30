<script lang="ts">
    import ScrollItem from '../scroll-item.svelte';

    interface Props {
        mode: 'bind' | 'function' | 'one-way' | 'uncontrolled';
        store: { index?: number; accept: boolean; log: string[] };
    }

    let { mode, store }: Props = $props();

    const list = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <ScrollItem aria-label="letters" bind:selectedIndex={store.index} {list} mode="normal" onSelect={(data) => log(`select ${data.index}`)} />
{:else if mode === 'function'}
    <ScrollItem
        aria-label="letters"
        bind:selectedIndex={
            () => store.index,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.index = value;
            }
        }
        {list}
        mode="normal"
        onSelect={(data) => log(`select ${data.index}`)}
    />
{:else if mode === 'one-way'}
    <ScrollItem aria-label="letters" {list} mode="normal" onSelect={(data) => log(`select ${data.index}`)} selectedIndex={store.index} />
{:else}
    <ScrollItem aria-label="letters" {list} mode="normal" onSelect={(data) => log(`select ${data.index}`)} />
{/if}
