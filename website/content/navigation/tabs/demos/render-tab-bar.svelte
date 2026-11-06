<script lang="ts">
    import { Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    const tabList: PlainTab[] = [
        { itemKey: '1', tab: '文档' },
        { itemKey: '2', tab: '快速起步' },
        { itemKey: '3', tab: '帮助' },
    ];
</script>

<Tabs activeKey="1" {tabList}>
    {#snippet tabBar(bar)}
        <div class="tab-bar-box">
            这是二次封装的Tab Bar，当前ActiveKey：{bar.tabBarProps.activeKey}
            {@render bar.tabBar()}
        </div>
    {/snippet}
    {#snippet panel(pane)}{pane.item.tab}{/snippet}
</Tabs>
