<script lang="ts">
    import { Cascader, Checkbox, TypographyText, type CascaderData, type TypographyEllipsis } from '@fibrae/semi-ui-svelte';

    const treeData = [
        {
            label: 'Semi',
            value: 'Semi',
            children: [
                {
                    label: 'Semi-Material Semi-Material Semi-Material Semi-Material',
                    value: 'Semi-Material',
                },
                {
                    label: 'Semi-DSM Semi-DSM Semi-DSM Semi-DSM',
                    value: 'Semi-DSM',
                },
                {
                    label: 'Semi Design Semi Design Semi Design Semi Design',
                    value: 'Semi',
                },
                {
                    label: 'Semi-C2D Semi-C2D Semi-C2D Semi-C2D Semi-C2D',
                    value: 'Semi-C2D',
                },
                {
                    label: 'Semi-D2C Semi-D2C Semi-D2C Semi-D2C Semi-D2C ',
                    value: 'Semi-D2C',
                },
            ],
        },
    ];
    const ellipsis: TypographyEllipsis = { showTooltip: { opts: { style: 'word-break: break-all' } } };
    const pathLabel = (data: CascaderData[]) => data.map((item) => item.label).join(' / ');
</script>

<div>
    <p>鼠标 hover 到选项可查看被省略文本完整内容</p>
    <br />
    <Cascader filterTreeNode placeholder="单选，输入 s 自定义搜索选项渲染结果" style="width: 320px" {treeData}>
        {#snippet filterItem({ props, data, selected })}
            <li {...props} style="justify-content: flex-start">
                <TypographyText {ellipsis} style={`width: 270px; ${selected ? 'color: var(--semi-color-primary)' : ''}`}>
                    {pathLabel(data)}
                </TypographyText>
            </li>
        {/snippet}
    </Cascader>
    <br />
    <Cascader filterTreeNode multiple placeholder="多选，输入 s 自定义搜索选项渲染结果" style="width: 320px; margin-top: 20px" {treeData}>
        {#snippet filterItem({ props, data, checkStatus, onCheck })}
            <li {...props} aria-label={pathLabel(data)} style="justify-content: flex-start">
                <Checkbox checked={checkStatus.checked} indeterminate={checkStatus.halfChecked} onChange={onCheck} tabindex={-1}>
                    <TypographyText {ellipsis} style="width: 250px">
                        {pathLabel(data)}
                    </TypographyText>
                </Checkbox>
            </li>
        {/snippet}
    </Cascader>
</div>
