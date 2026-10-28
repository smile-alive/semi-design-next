import { Cascader, Typography, Checkbox, type CascaderFilterRenderProps } from '@fibrae/semi-ui-react';

export default function CascaderDemo() {
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
    const { Text } = Typography;

    const renderSearchOptionSingle = ({ className, data, onClick, selected }: CascaderFilterRenderProps) => {
        return (
            <li className={className} style={{ justifyContent: 'flex-start' }} role="option" aria-selected={selected} onClick={onClick}>
                <Text ellipsis={{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }} style={{ width: 270, color: selected ? 'var(--semi-color-primary)' : undefined }}>
                    {data.map((item) => item.label).join(' / ')}
                </Text>
            </li>
        );
    };

    const renderSearchOptionMultiple = ({ className, data, checkStatus, onCheck }: CascaderFilterRenderProps) => {
        const label = data.map((item) => item.label).join(' / ');
        return (
            <li className={className} style={{ justifyContent: 'flex-start' }} role="option" aria-label={label} aria-selected={checkStatus.checked}>
                <Checkbox tabIndex={-1} onChange={onCheck} indeterminate={checkStatus.halfChecked} checked={checkStatus.checked}>
                    <Text ellipsis={{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }} style={{ width: 250 }}>
                        {label}
                    </Text>
                </Checkbox>
            </li>
        );
    };

    return (
        <div>
            <p>鼠标 hover 到选项可查看被省略文本完整内容</p>
            <br />
            <Cascader style={{ width: 320 }} treeData={treeData} placeholder="单选，输入 s 自定义搜索选项渲染结果" filterTreeNode filterRender={renderSearchOptionSingle} />
            <br />
            <Cascader multiple style={{ width: 320, marginTop: 20 }} treeData={treeData} placeholder="多选，输入 s 自定义搜索选项渲染结果" filterTreeNode filterRender={renderSearchOptionMultiple} />
        </div>
    );
}
