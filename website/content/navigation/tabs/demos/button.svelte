<script lang="ts">
    import { Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    const tabList: PlainTab[] = [
        { itemKey: '1', tab: '文档' },
        { itemKey: '2', tab: '快速起步' },
        { itemKey: '3', tab: '帮助' },
    ];
</script>

<Tabs {tabList} type="button">
    {#snippet panel({ item })}{item.tab}{/snippet}
</Tabs>
