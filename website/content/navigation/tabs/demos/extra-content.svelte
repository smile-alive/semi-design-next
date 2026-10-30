<script lang="ts">
    import { Button, Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    const tabList: PlainTab[] = [
        { itemKey: '1', tab: '文档' },
        { itemKey: '2', tab: '快速起步' },
        { itemKey: '3', tab: '帮助' },
    ];

    const onExtraClick = () => {
        alert('you have clicked me!');
    };
</script>

<Tabs activeKey="1" {tabList}>
    {#snippet tabBarExtraContent()}
        <Button onclick={onExtraClick}>Extra Action</Button>
    {/snippet}
    {#snippet panel({ item })}{item.tab}{/snippet}
</Tabs>
