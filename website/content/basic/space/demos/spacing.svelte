<script lang="ts">
    import { Button, Space } from '@fibrae/semi-ui-svelte';

    const presets = ['tight', 'medium', 'loose'] as const;
    const four = [1, 2, 3, 4];
    const ten = Array.from({ length: 10 }, (_, index) => index);
</script>

<!-- Tabs is not ported to Svelte yet, so the four spacing variants are stacked with plain headings -->
{#each presets as preset (preset)}
    <h4>{preset}</h4>
    <Space spacing={preset} style="margin-top: 15px">
        {#each four as item (item)}
            <Button theme="solid" type="primary">按钮</Button>
        {/each}
    </Space>
{/each}
<h4>array</h4>
<Space spacing={[8, 16]} style="margin-top: 15px" wrap>
    {#each ten as item (item)}
        <Button theme="solid" type="primary">按钮</Button>
    {/each}
</Space>
