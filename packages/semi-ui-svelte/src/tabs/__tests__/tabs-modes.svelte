<script lang="ts">
    import { Tabs } from '../index';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: string | null; accept: boolean; log: string[] } } = $props();

    const tabList = [
        { itemKey: 'a', tab: 'A' },
        { itemKey: 'b', tab: 'B' },
        { itemKey: 'c', tab: 'C' },
    ];

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <Tabs bind:activeKey={store.value} onChange={(key) => log(`change ${key}`)} {tabList} />
{:else if mode === 'function'}
    <Tabs
        bind:activeKey={
            () => store.value,
            (key) => {
                log(`set ${key}`);
                if (store.accept) store.value = key;
            }
        }
        onChange={(key) => log(`change ${key}`)}
        {tabList}
    />
{:else if mode === 'one-way'}
    <Tabs activeKey={store.value} onChange={(key) => log(`change ${key}`)} {tabList} />
{:else}
    <Tabs onChange={(key) => log(`change ${key}`)} {tabList} />
{/if}
