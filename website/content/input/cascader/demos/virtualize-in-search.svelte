<script lang="ts">
    import { Cascader, Checkbox, TypographyText, type TypographyEllipsis } from '@fibrae/semi-ui-svelte';

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
    const ellipsis: TypographyEllipsis = { showTooltip: { opts: { style: 'word-break: break-all' } } };
</script>

<Cascader filterTreeNode multiple placeholder="输入 通用 or 场景 进行搜索" style="width: 320px" {treeData} virtualizeInSearch={virtualize}>
    {#snippet filterItem({ props, data, onCheck, checkStatus })}
        <div {...props} style={`${props.style ?? ''}; justify-content: start; padding: 8px 16px 8px 12px; box-sizing: border-box`}>
            <Checkbox checked={checkStatus.checked} indeterminate={checkStatus.halfChecked} onChange={onCheck} style="margin-right: 8px" />
            <TypographyText {ellipsis} style="max-width: 260px">
                {data.map((item) => item.label).join(' | ')}
            </TypographyText>
        </div>
    {/snippet}
</Cascader>
