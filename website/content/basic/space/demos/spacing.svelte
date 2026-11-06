<script lang="ts">
    import { Button, Space, Tabs } from '@fibrae/semi-ui-svelte';

    const tabList = [
        { itemKey: '1', tab: 'tight' },
        { itemKey: '2', tab: 'medium' },
        { itemKey: '3', tab: 'loose' },
        { itemKey: '4', tab: 'array' },
    ];
    const fourButtons = [1, 2, 3, 4];
    const tenButtons = Array.from({ length: 10 }, (_, index) => index);
</script>

<Tabs {tabList} type="line">
    {#snippet panel(pane)}
        {#if pane.itemKey === '1'}
            <Space spacing="tight" style="margin-block-start: 15px">
                {#each fourButtons as item (item)}
                    <Button theme="solid" type="primary">按钮</Button>
                {/each}
            </Space>
        {:else if pane.itemKey === '2'}
            <Space spacing="medium" style="margin-block-start: 15px">
                {#each fourButtons as item (item)}
                    <Button theme="solid" type="primary">按钮</Button>
                {/each}
            </Space>
        {:else if pane.itemKey === '3'}
            <Space spacing="loose" style="margin-block-start: 15px">
                {#each fourButtons as item (item)}
                    <Button theme="solid" type="primary">按钮</Button>
                {/each}
            </Space>
        {:else}
            <Space spacing={[8, 16]} style="margin-block-start: 15px" wrap>
                {#each tenButtons as item (item)}
                    <Button theme="solid" type="primary">按钮</Button>
                {/each}
            </Space>
        {/if}
    {/snippet}
</Tabs>
