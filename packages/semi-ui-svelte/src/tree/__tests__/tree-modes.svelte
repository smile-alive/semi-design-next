<script lang="ts">
    import type { TreeValue } from '../interface';
    import Tree from '../tree.svelte';
    import { treeData } from './data';

    let { mode, store, multiple = false }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: TreeValue; expandedKeys?: string[]; accept: boolean; log: string[] }; multiple?: boolean } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <Tree bind:expandedKeys={store.expandedKeys} bind:value={store.value} motion={false} {multiple} onChange={(value) => log(`change ${value}`)} onExpand={(keys) => log(`expand ${keys.join()}`)} {treeData} />
{:else if mode === 'function'}
    <Tree
        bind:expandedKeys={
            () => store.expandedKeys,
            (keys) => {
                log(`set keys ${keys?.join()}`);
                if (store.accept) store.expandedKeys = keys;
            }
        }
        bind:value={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        motion={false}
        onChange={(value) => log(`change ${value}`)}
        onExpand={(keys) => log(`expand ${keys.join()}`)}
        {treeData}
    />
{:else if mode === 'one-way'}
    <Tree expandedKeys={store.expandedKeys} motion={false} onChange={(value) => log(`change ${value}`)} onExpand={(keys) => log(`expand ${keys.join()}`)} {treeData} value={store.value} />
{:else}
    <Tree motion={false} onChange={(value) => log(`change ${value}`)} onExpand={(keys) => log(`expand ${keys.join()}`)} {treeData} />
{/if}
