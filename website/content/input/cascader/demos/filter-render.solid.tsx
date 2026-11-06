import { Cascader, Checkbox, type CascaderFilterRenderProps, Typography } from '@fibrae/semi-ui-solid';

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

const renderSearchOptionSingle = (item: CascaderFilterRenderProps) => (
    <li class={item.class} style={{ 'justify-content': 'flex-start' }} role="option" aria-selected={item.selected} onClick={(e) => item.onClick(e)}>
        <Typography.Text ellipsis={{ showTooltip: { opts: { style: { 'word-break': 'break-all' } } } }} style={{ width: '270px', color: item.selected ? 'var(--semi-color-primary)' : undefined }}>
            {item.data.map((option) => option.label).join(' / ')}
        </Typography.Text>
    </li>
);

function renderSearchOptionMultiple(item: CascaderFilterRenderProps) {
    const label = () => item.data.map((option) => option.label).join(' / ');
    return (
        <li class={item.class} style={{ 'justify-content': 'flex-start' }} role="option" aria-label={label()} aria-selected={item.checkStatus.checked}>
            <Checkbox tabIndex={-1} onChange={item.onCheck} indeterminate={item.checkStatus.halfChecked} checked={item.checkStatus.checked}>
                <Typography.Text ellipsis={{ showTooltip: { opts: { style: { 'word-break': 'break-all' } } } }} style={{ width: '250px' }}>
                    {label()}
                </Typography.Text>
            </Checkbox>
        </li>
    );
}

export default function CascaderDemo() {
    return (
        <div>
            <p>鼠标 hover 到选项可查看被省略文本完整内容</p>
            <br />
            <Cascader style={{ width: '320px' }} treeData={treeData} placeholder="单选，输入 s 自定义搜索选项渲染结果" filterTreeNode filterRender={renderSearchOptionSingle} />
            <br />
            <Cascader multiple style={{ width: '320px', 'margin-block-start': '20px' }} treeData={treeData} placeholder="多选，输入 s 自定义搜索选项渲染结果" filterTreeNode filterRender={renderSearchOptionMultiple} />
        </div>
    );
}
