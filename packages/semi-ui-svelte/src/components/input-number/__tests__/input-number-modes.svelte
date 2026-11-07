<script lang="ts">
    import InputNumber from '../input-number.svelte';
    import type { InputNumberProps } from '../interface';

    let {
        mode,
        store,
        props = {},
    }: {
        mode: 'bind' | 'function' | 'one-way' | 'uncontrolled';
        store: { value?: number | string; accept: boolean; log: string[] };
        props?: InputNumberProps;
    } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <InputNumber bind:value={store.value} {...props} onChange={(value) => log(`change ${value}`)} />
{:else if mode === 'function'}
    <InputNumber
        bind:value={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        {...props}
        onChange={(value) => log(`change ${value}`)}
    />
{:else if mode === 'one-way'}
    <InputNumber {...props} onChange={(value) => log(`change ${value}`)} value={store.value} />
{:else}
    <InputNumber {...props} onChange={(value) => log(`change ${value}`)} />
{/if}
