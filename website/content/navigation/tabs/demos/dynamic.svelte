<script lang="ts">
    import { Button, ButtonGroup, Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    let newTabIndex = 0;
    let tabList = $state<PlainTab[]>([
        { tab: 'Tab 1', itemKey: '1' },
        { tab: 'Tab 2', itemKey: '2' },
    ]);
    const contents: Record<string, string> = { '1': 'Content of Tab Pane 1', '2': 'Content of Tab Pane 2' };
    let activeKey = $state<string | null | undefined>('1');

    const add = () => {
        const index = newTabIndex++;
        tabList = [...tabList, { tab: `New Tab ${index}`, itemKey: `newTab${index}` }];
        activeKey = `newTab${index}`;
    };

    const remove = () => {
        if (tabList.length > 1) {
            tabList = tabList.slice(0, -1);
            activeKey = tabList[tabList.length - 1].itemKey;
        }
    };
</script>

<Tabs bind:activeKey {tabList}>
    {#snippet tabBarExtraContent()}
        <ButtonGroup>
            <Button onclick={add}>新增</Button>
            <Button onclick={remove}>删除</Button>
        </ButtonGroup>
    {/snippet}
    {#snippet panel({ itemKey })}{contents[itemKey] ?? 'New Tab Pane'}{/snippet}
</Tabs>
