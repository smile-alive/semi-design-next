<script lang="ts" module>
    import type { TabsProps } from '../interface';

    export interface Pane {
        itemKey: string;
        tab: string;
        content?: string;
        disabled?: boolean;
        closable?: boolean;
    }

    export type FixtureSnippet = 'tab' | 'input-tab' | 'icon' | 'extra' | 'item-bar' | 'wrap-bar' | 'arrow' | 'more-trigger' | 'more-content';

    // `content` renders the children snippet (one labelled panel) instead of a panel per entry
    export interface FixtureStore {
        props: TabsProps;
        panes: Pane[];
        snippets?: FixtureSnippet[];
        content?: boolean;
    }
</script>

<script lang="ts">
    import { TabItem, Tabs } from '../index';
    import type { TabsArrowSnippetProps, TabsMoreContentSnippetProps, TabsPanelSnippetProps, TabsTabBarSnippetProps, TabsTabSnippetProps } from '../interface';

    let { store }: { store: FixtureStore } = $props();

    const has = (name: FixtureSnippet) => store.snippets?.includes(name);
    const tabList = $derived(store.panes.map(({ itemKey, tab, disabled, closable }) => ({ itemKey, tab, disabled, closable })));
    const contentOf = (itemKey: string) => store.panes.find((pane) => pane.itemKey === itemKey)?.content;
</script>

{#snippet panel({ itemKey }: TabsPanelSnippetProps)}
    {contentOf(itemKey)}
{/snippet}
{#snippet content()}
    content
{/snippet}
{#snippet tabSnippet({ item, index }: TabsTabSnippetProps)}
    <b>{index}:{item.tab}</b>
{/snippet}
{#snippet inputTab({ item }: TabsTabSnippetProps)}
    {#if item.itemKey === store.panes[0]?.itemKey}<input aria-label="name" />{:else}{item.tab}{/if}
{/snippet}
{#snippet iconSnippet({ item }: TabsTabSnippetProps)}
    {#if item.itemKey === store.panes[0]?.itemKey}<i class="own-icon"></i>{/if}
{/snippet}
{#snippet extra()}
    <button style="color: red" type="button">Extra</button>
{/snippet}
{#snippet bar({ tabBarProps, tabBar }: TabsTabBarSnippetProps)}
    {#if has('item-bar')}
        <div role="tablist">
            {#each tabBarProps.list as item (item.itemKey)}
                {#snippet label()}{item.tab}{/snippet}
                <TabItem itemKey={item.itemKey} selected={item.itemKey === tabBarProps.activeKey} tab={label} />
            {/each}
        </div>
    {:else}
        <div class="wrap">{@render tabBar()}</div>
    {/if}
{/snippet}
{#snippet arrowSnippet({ items, position, defaultNode }: TabsArrowSnippetProps)}
    <span class="custom-{position}">{items.length}{@render defaultNode()}</span>
{/snippet}
{#snippet moreTrigger()}
    <span>custom more</span>
{/snippet}
{#snippet moreContent({ items }: TabsMoreContentSnippetProps)}
    <ul class="custom-menu">
        {#each items as item (item.itemKey)}<li>{item.tab}</li>{/each}
    </ul>
{/snippet}

<Tabs
    {...store.props}
    arrow={has('arrow') ? arrowSnippet : undefined}
    children={store.content ? content : undefined}
    icon={has('icon') ? iconSnippet : undefined}
    moreContent={has('more-content') ? moreContent : undefined}
    moreTrigger={has('more-trigger') ? moreTrigger : undefined}
    panel={store.content ? undefined : panel}
    tab={has('tab') ? tabSnippet : has('input-tab') ? inputTab : undefined}
    tabBar={has('item-bar') || has('wrap-bar') ? bar : undefined}
    tabBarExtraContent={has('extra') ? extra : undefined}
    {tabList}
/>
