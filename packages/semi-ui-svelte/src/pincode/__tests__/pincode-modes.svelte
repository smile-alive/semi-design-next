<script lang="ts">
    import type { PinCodeProps } from '../interface';
    import PinCode from '../pincode.svelte';

    let {
        mode,
        store,
        props = {},
    }: {
        mode: 'bind' | 'function' | 'one-way' | 'uncontrolled';
        store: { value?: string; accept: boolean; log: string[] };
        props?: PinCodeProps;
    } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <PinCode bind:value={store.value} {...props} onChange={(value) => log(`change ${value}`)} />
{:else if mode === 'function'}
    <PinCode
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
    <PinCode {...props} onChange={(value) => log(`change ${value}`)} value={store.value} />
{:else}
    <PinCode {...props} onChange={(value) => log(`change ${value}`)} />
{/if}
<span data-testid="value">{store.value}</span>
