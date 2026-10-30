<script lang="ts">
    import { Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    let tabList = $state<PlainTab[]>([
        { tab: '文档', itemKey: '1', closable: true },
        { tab: '快速起步', itemKey: '2', closable: true },
        { tab: '帮助', itemKey: '3', closable: false },
    ]);

    const close = (key: string) => {
        tabList = tabList.filter((t) => t.itemKey !== key);
    };
</script>

<Tabs onTabClose={close} {tabList} type="card">
    {#snippet panel({ item })}{item.tab}{/snippet}
</Tabs>
