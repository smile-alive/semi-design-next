<script lang="ts">
    import { TabItem, Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    let activeKey = $state<string | null | undefined>('1');
    let tabList = $state<PlainTab[]>([
        { itemKey: '1', tab: '文档' },
        { itemKey: '2', tab: '表格' },
        { itemKey: '3', tab: '幻灯片' },
        { itemKey: '4', tab: '表单' },
    ]);
    const contents: Record<string, string> = { '1': '文档内容', '2': '表格内容', '3': '幻灯片内容', '4': '表单内容' };

    // HTML5 drag and drop on the TabItems: the website has no sortable library for Svelte, and a sortable list would wrap
    // each tab in a button-role element that nests focusable tabs. Known limit: pointer only; use a sortable library for keyboard sorting.
    let draggingKey = $state<string | null>(null);
    const moveTo = (targetKey: string) => {
        const from = tabList.findIndex((item) => item.itemKey === draggingKey);
        const to = tabList.findIndex((item) => item.itemKey === targetKey);
        if (from < 0 || to < 0 || from === to) return;
        const next = [...tabList];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        tabList = next;
    };
</script>

<Tabs bind:activeKey {tabList} type="line">
    <!-- the bar keeps Semi's own .semi-tabs-bar shell; the TabItems inside select their Tabs by themselves -->
    {#snippet tabBar()}
        <div aria-orientation="horizontal" class="semi-tabs-bar semi-tabs-bar-line semi-tabs-bar-top" role="tablist">
            {#each tabList as item (item.itemKey)}
                <TabItem
                    draggable="true"
                    itemKey={item.itemKey}
                    selected={activeKey === item.itemKey}
                    style={`cursor: grab; opacity: ${draggingKey === item.itemKey ? 0.5 : 1}; display: inline-flex`}
                    ondragend={() => (draggingKey = null)}
                    ondragenter={(event) => {
                        event.preventDefault();
                        moveTo(item.itemKey);
                    }}
                    ondragover={(event) => event.preventDefault()}
                    ondragstart={() => (draggingKey = item.itemKey)}
                >
                    {#snippet tab()}{item.tab}{/snippet}
                </TabItem>
            {/each}
        </div>
    {/snippet}
    {#snippet panel({ itemKey })}
        <div style="padding: 20px">{contents[itemKey]}</div>
    {/snippet}
</Tabs>
