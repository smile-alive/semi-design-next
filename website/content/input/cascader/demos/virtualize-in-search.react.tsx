import { useMemo, useCallback } from 'react';
import { Cascader, Checkbox, Typography, type CascaderFilterRenderProps } from '@fibrae/semi-ui-react';

const virtualize = {
    // Height = default panel 180px minus 2 * 8px padding
    height: 172,
    width: 320,
    itemSize: 36,
};

export default function CascaderDemo() {
    const treeData = useMemo(
        () =>
            ['通用', '场景'].map((label, m) => ({
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
            })),
        []
    );

    const filterRender = useCallback(({ data, onCheck, checkStatus, className }: CascaderFilterRenderProps) => {
        return (
            <div className={className} style={{ justifyContent: 'start', padding: '8px 16px 8px 12px', boxSizing: 'border-box' }}>
                <Checkbox onChange={onCheck} indeterminate={checkStatus.halfChecked} checked={checkStatus.checked} style={{ marginRight: 8 }} />
                <Typography.Text ellipsis={{ showTooltip: { opts: { style: { wordBreak: 'break-all' } } } }} style={{ maxWidth: 260 }}>
                    {data.map((item) => item.label).join(' | ')}
                </Typography.Text>
            </div>
        );
    }, []);

    return <Cascader multiple filterTreeNode style={{ width: 320 }} treeData={treeData} placeholder="输入 通用 or 场景 进行搜索" virtualizeInSearch={virtualize} filterRender={filterRender} />;
}
