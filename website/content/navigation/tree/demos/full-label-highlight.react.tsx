import { useState } from 'react';
import { IconFixedStroked, IconSectionStroked, IconAbsoluteStroked, IconInnerSectionStroked, IconComponentStroked } from '@fibrae/semi-icons-react';
import { Tree, type TreeNodeData, type TreeProps } from '@fibrae/semi-ui-react';

const treeData = [
    {
        label: '黑色固定按钮',
        icon: <IconFixedStroked style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />,
        key: 'fix-btn-0',
    },
    {
        label: '模块',
        key: 'module-0',
        icon: <IconSectionStroked style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />,
        children: [
            {
                label: '可自由摆放的组件',
                icon: <IconAbsoluteStroked style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />,
                key: 'free-compo-0',
            },
            {
                label: '分栏容器',
                icon: <IconInnerSectionStroked style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />,
                key: 'split-col-0',
                children: [
                    {
                        label: '按钮组件',
                        icon: <IconComponentStroked style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />,
                        key: 'btn-0',
                    },
                    {
                        label: '按钮组件',
                        icon: <IconComponentStroked style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />,
                        key: 'btn-1',
                    },
                ],
            },
        ],
    },
    {
        label: '模块',
        icon: <IconSectionStroked style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />,
        key: 'module-1',
        children: [
            {
                label: '自定义组件',
                icon: <IconComponentStroked style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />,
                key: 'cus-0',
            },
        ],
    },
];

const treeStyle = {
    width: 260,
    height: 420,
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const [selected, setSelected] = useState(new Set<string | undefined>());
    const [selectedThroughParent, setSelectedThroughParent] = useState(new Set<string | undefined>());

    const findDescendantKeys = (node: TreeNodeData) => {
        const res = [node.key];
        const findChild = (item?: TreeNodeData) => {
            if (!item) return;
            const { children } = item;

            if (children?.length) {
                children.forEach((child) => {
                    res.push(child.key);
                    findChild(child);
                });
            }
        };
        findChild(node);
        return res;
    };

    const handleSelect: TreeProps['onSelect'] = (key, _bool, node) => {
        setSelected(new Set([key]));
        setSelectedThroughParent(new Set(findDescendantKeys(node)));
    };

    const rowBackground = (key?: string) => {
        if (selected.has(key)) return 'var(--semi-blue-0)';
        if (selectedThroughParent.has(key)) return 'color-mix(in srgb, var(--semi-blue-0) 50%, transparent)';
        return 'transparent';
    };

    const renderLabel: TreeProps['renderFullLabel'] = (row) => (
        <li className={row.className} role="treeitem" onClick={row.onClick} style={{ backgroundColor: rowBackground(row.data.key) }}>
            {row.data.children && row.data.children.length ? row.expandIcon : <span style={{ width: 24 }} />}
            {row.data.icon}
            <span>{row.data.label}</span>
        </li>
    );

    return <Tree treeData={treeData} renderFullLabel={renderLabel} onSelect={handleSelect} style={treeStyle} defaultExpandAll />;
}
