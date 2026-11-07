<script lang="ts">
    import Slider from '../slider.svelte';

    type Value = number | number[] | undefined;

    let {
        mode,
        store,
        range = false,
    }: {
        mode: 'bind' | 'function' | 'one-way' | 'uncontrolled';
        store: { value: Value; accept: boolean; log: string[] };
        range?: boolean;
    } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <Slider aria-label="volume" bind:value={store.value} onAfterChange={(value) => log(`after ${JSON.stringify(value)}`)} onChange={(value) => log(`change ${JSON.stringify(value)}`)} {range} style="width: 100px; height: 32px" />
{:else if mode === 'function'}
    <Slider
        aria-label="volume"
        bind:value={
            () => store.value,
            (value) => {
                log(`set ${JSON.stringify(value)}`);
                if (store.accept) store.value = value;
            }
        }
        onAfterChange={(value) => log(`after ${JSON.stringify(value)}`)}
        onChange={(value) => log(`change ${JSON.stringify(value)}`)}
        {range}
        style="width: 100px; height: 32px"
    />
{:else if mode === 'one-way'}
    <Slider aria-label="volume" onAfterChange={(value) => log(`after ${JSON.stringify(value)}`)} onChange={(value) => log(`change ${JSON.stringify(value)}`)} {range} style="width: 100px; height: 32px" value={store.value} />
{:else}
    <Slider aria-label="volume" onAfterChange={(value) => log(`after ${JSON.stringify(value)}`)} onChange={(value) => log(`change ${JSON.stringify(value)}`)} {range} style="width: 100px; height: 32px" />
{/if}
