<script lang="ts">
    import type { ItemKey, NavItems } from '../interface';
    import Nav from '../nav.svelte';

    interface Store {
        selected?: ItemKey[] | null;
        open?: ItemKey[] | null;
        collapsed?: boolean;
        accept: boolean;
        log: string[];
    }

    // `target` is the controlled value under test; the others stay unset
    let { target, mode, items, store }: { target: 'selected' | 'open' | 'collapsed'; mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; items: NavItems; store: Store } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if target === 'selected'}
    {#if mode === 'bind'}
        <Nav bind:selectedKeys={store.selected} {items} onSelect={(data) => log(`select ${data.itemKey}`)} />
    {:else if mode === 'function'}
        <Nav
            bind:selectedKeys={
                () => store.selected,
                (value) => {
                    log(`set ${value}`);
                    if (store.accept) store.selected = value;
                }
            }
            {items}
            onSelect={(data) => log(`select ${data.itemKey}`)}
        />
    {:else if mode === 'one-way'}
        <Nav {items} onSelect={(data) => log(`select ${data.itemKey}`)} selectedKeys={store.selected} />
    {:else}
        <Nav {items} onSelect={(data) => log(`select ${data.itemKey}`)} />
    {/if}
{:else if target === 'open'}
    {#if mode === 'bind'}
        <Nav bind:openKeys={store.open} {items} onOpenChange={(data) => log(`open ${data.itemKey} ${data.isOpen}`)} />
    {:else if mode === 'function'}
        <Nav
            bind:openKeys={
                () => store.open,
                (value) => {
                    log(`set ${value}`);
                    if (store.accept) store.open = value;
                }
            }
            {items}
            onOpenChange={(data) => log(`open ${data.itemKey} ${data.isOpen}`)}
        />
    {:else if mode === 'one-way'}
        <Nav {items} onOpenChange={(data) => log(`open ${data.itemKey} ${data.isOpen}`)} openKeys={store.open} />
    {:else}
        <Nav {items} onOpenChange={(data) => log(`open ${data.itemKey} ${data.isOpen}`)} />
    {/if}
{:else if mode === 'bind'}
    <Nav bind:isCollapsed={store.collapsed} footer={{ collapseButton: true }} {items} onCollapseChange={(value) => log(`collapse ${value}`)} />
{:else if mode === 'function'}
    <Nav
        bind:isCollapsed={
            () => store.collapsed,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.collapsed = value;
            }
        }
        footer={{ collapseButton: true }}
        {items}
        onCollapseChange={(value) => log(`collapse ${value}`)}
    />
{:else if mode === 'one-way'}
    <Nav footer={{ collapseButton: true }} isCollapsed={store.collapsed} {items} onCollapseChange={(value) => log(`collapse ${value}`)} />
{:else}
    <Nav footer={{ collapseButton: true }} {items} onCollapseChange={(value) => log(`collapse ${value}`)} />
{/if}
