<script lang="ts">
    import type { TransferDataItem, TransferValue } from '../interface';
    import Transfer from '../transfer.svelte';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: TransferValue; accept: boolean; log: string[]; dataSource: TransferDataItem[] } } = $props();

    const log = (values: TransferValue) => {
        store.log.push(`change ${JSON.stringify(values)}`);
    };
</script>

{#if mode === 'bind'}
    <Transfer bind:value={store.value} dataSource={store.dataSource} onChange={log} />
{:else if mode === 'function'}
    <Transfer
        bind:value={
            () => store.value,
            (next) => {
                store.log.push(`set ${JSON.stringify(next)}`);
                if (store.accept) store.value = next;
            }
        }
        dataSource={store.dataSource}
        onChange={log}
    />
{:else if mode === 'one-way'}
    <Transfer dataSource={store.dataSource} onChange={log} value={store.value} />
{:else}
    <Transfer dataSource={store.dataSource} onChange={log} />
{/if}
