<script lang="ts">
    import { Cascader, Checkbox, Typography } from '@fibrae/semi-ui-svelte';

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
</script>

<div>
    <p>鼠标 hover 到选项可查看被省略文本完整内容</p>
    <br />
    <Cascader filterTreeNode placeholder="单选，输入 s 自定义搜索选项渲染结果" style="width: 320px" {treeData}>
        {#snippet filterItem(item)}
            <li {...item.props} style="justify-content: flex-start">
                <Typography.Text ellipsis={{ showTooltip: { opts: { style: 'word-break: break-all' } } }} style={`width: 270px; ${item.selected ? 'color: var(--semi-color-primary)' : ''}`}>
                    {item.data.map((option) => option.label).join(' / ')}
                </Typography.Text>
            </li>
        {/snippet}
    </Cascader>
    <br />
    <Cascader filterTreeNode multiple placeholder="多选，输入 s 自定义搜索选项渲染结果" style="width: 320px; margin-block-start: 20px" {treeData}>
        {#snippet filterItem(item)}
            <li {...item.props} aria-label={item.data.map((option) => option.label).join(' / ')} style="justify-content: flex-start">
                <Checkbox checked={item.checkStatus.checked} indeterminate={item.checkStatus.halfChecked} onChange={item.onCheck} tabindex={-1}>
                    <Typography.Text ellipsis={{ showTooltip: { opts: { style: 'word-break: break-all' } } }} style="width: 250px">
                        {item.data.map((option) => option.label).join(' / ')}
                    </Typography.Text>
                </Checkbox>
            </li>
        {/snippet}
    </Cascader>
</div>
