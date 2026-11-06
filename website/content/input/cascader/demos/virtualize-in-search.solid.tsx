import { Cascader, Checkbox, type CascaderFilterRenderProps, Typography } from '@fibrae/semi-ui-solid';

const treeData = ['通用', '场景'].map((label, m) => ({
    label: label,
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

const renderFilterItem = (item: CascaderFilterRenderProps) => (
    <div class={item.class} style={{ 'justify-content': 'start', padding: '8px 16px 8px 12px', 'box-sizing': 'border-box' }}>
        <Checkbox onChange={item.onCheck} indeterminate={item.checkStatus.halfChecked} checked={item.checkStatus.checked} style={{ 'margin-inline-end': '8px' }} />
        <Typography.Text ellipsis={{ showTooltip: { opts: { style: { 'word-break': 'break-all' } } } }} style={{ 'max-width': '260px' }}>
            {item.data.map((option) => option.label).join(' | ')}
        </Typography.Text>
    </div>
);

export default function CascaderDemo() {
    return <Cascader multiple filterTreeNode style={{ width: '320px' }} treeData={treeData} placeholder="输入 通用 or 场景 进行搜索" virtualizeInSearch={virtualize} filterRender={renderFilterItem} />;
}
