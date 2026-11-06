<script lang="ts">
    import { Cascader, Checkbox, Typography } from '@fibrae/semi-ui-svelte';

    const treeData = ['通用', '场景'].map((label, m) => ({
        label,
        value: m,
        children: Array.from({ length: 100 }, (_item, n) => ({
            value: `${m}-${n}`,
            label: `${m}-${n} 第二级`,
            children: Array.from({ length: 20 }, (_item, o) => ({
                value: `${m}-${n}-${o}`,
                label: `${m}-${n}-${o} 第三级详细内容`,
            })),
        })),
    }));

    const virtualize = {
        // Height = default panel 180px minus 2 * 8px padding
        height: 172,
        width: 320,
        itemSize: 36,
    };
</script>

<Cascader filterTreeNode multiple placeholder="输入 通用 or 场景 进行搜索" style="width: 320px" {treeData} virtualizeInSearch={virtualize}>
    {#snippet filterItem(item)}
        <div {...item.props} style={`${item.props.style ?? ''}; justify-content: start; padding: 8px 16px 8px 12px; box-sizing: border-box`}>
            <Checkbox checked={item.checkStatus.checked} indeterminate={item.checkStatus.halfChecked} onChange={item.onCheck} style="margin-inline-end: 8px" />
            <Typography.Text ellipsis={{ showTooltip: { opts: { style: 'word-break: break-all' } } }} style="max-width: 260px">
                {item.data.map((option) => option.label).join(' | ')}
            </Typography.Text>
        </div>
    {/snippet}
</Cascader>
