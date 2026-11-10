import { Cascader, Typography, Checkbox, type CascaderFilterRenderProps } from '@fibrae/semi-ui-react';

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
                label: 'Semi-Theme Semi-Theme Semi-Theme Semi-Theme',
                value: 'Semi-Theme',
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
                label: 'Semi-Icons Semi-Icons Semi-Icons Semi-Icons Semi-Icons ',
                value: 'Semi-Icons',
            },
        ],
    },
];

const renderSearchOptionSingle = (item: CascaderFilterRenderProps) => (
    <li className={item.className} style={{ justifyContent: 'flex-start' }} role="option" aria-selected={item.selected} onClick={item.onClick}>
        <Typography.Text ellipsis={{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }} style={{ width: 270, color: item.selected ? 'var(--semi-color-primary)' : undefined }}>
            {item.data.map((option) => option.label).join(' / ')}
        </Typography.Text>
    </li>
);

const renderSearchOptionMultiple = (item: CascaderFilterRenderProps) => {
    const label = item.data.map((option) => option.label).join(' / ');
    return (
        <li className={item.className} style={{ justifyContent: 'flex-start' }} role="option" aria-label={label} aria-selected={item.checkStatus.checked}>
            <Checkbox tabIndex={-1} onChange={item.onCheck} indeterminate={item.checkStatus.halfChecked} checked={item.checkStatus.checked}>
                <Typography.Text ellipsis={{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }} style={{ width: 250 }}>
                    {label}
                </Typography.Text>
            </Checkbox>
        </li>
    );
};

export default function CascaderDemo() {
    return (
        <div>
            <p>鼠标 hover 到选项可查看被省略文本完整内容</p>
            <br />
            <Cascader style={{ width: 320 }} treeData={treeData} placeholder="单选，输入 s 自定义搜索选项渲染结果" filterTreeNode filterRender={renderSearchOptionSingle} />
            <br />
            <Cascader multiple style={{ width: 320, marginBlockStart: 20 }} treeData={treeData} placeholder="多选，输入 s 自定义搜索选项渲染结果" filterTreeNode filterRender={renderSearchOptionMultiple} />
        </div>
    );
}
