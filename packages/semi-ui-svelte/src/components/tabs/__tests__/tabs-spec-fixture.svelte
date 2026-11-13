<script lang="ts">
    import type { TabsSpecProps } from '@test/specs/tabs';
    import { ConfigProvider } from '../../config-provider';
    import { Tabs } from '../index';
    import type { TabsPanelSnippetProps } from '../interface';

    let { store }: { store: TabsSpecProps } = $props();

    const tabList = $derived(store.items.map(({ itemKey, tab, disabled, closable }) => ({ itemKey, tab, disabled, closable })));
    // Svelte has no `defaultActiveKey` and a one-way `activeKey` lets the component override it locally: the spec's
    // default is the binding's initial value and its controlled value goes through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state<string | undefined>(store.defaultActiveKey);
</script>

{#snippet panel({ itemKey }: TabsPanelSnippetProps)}
    {store.items.find((item) => item.itemKey === itemKey)?.content}
{/snippet}

<ConfigProvider direction={store.direction}>
    <Tabs
        aria-label={store['aria-label']}
        bind:activeKey={
            () => (store.activeKey === undefined ? chosen : store.activeKey),
            (key) => {
                chosen = key ?? undefined;
            }
        }
        keepDOM={store.keepDOM}
        lazyRender={store.lazyRender}
        onChange={store.onChange}
        onTabClick={store.onTabClick}
        onTabClose={store.onTabClose}
        {panel}
        size={store.size}
        {tabList}
        tabPosition={store.tabPosition}
        type={store.type}
    />
</ConfigProvider>
