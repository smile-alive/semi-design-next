import { useState } from 'react';
import { IconFixedStroked, IconSectionStroked, IconAbsoluteStroked, IconComponentStroked } from '@fibrae/semi-icons-react';
import { Tree, type TreeNodeData, type TreeOnDragProps, type TreeProps } from '@fibrae/semi-ui-react';

type LoopCallback = (item: TreeNodeData, ind: number, arr: TreeNodeData[]) => void;

const defaultTreeData = [
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
                icon: <IconSectionStroked style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />,
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
    const [treeData, setTreeData] = useState<TreeNodeData[]>(defaultTreeData);

    const onDrop = (info: TreeOnDragProps) => {
        const { dropToGap, node, dragNode } = info;
        const dropKey = node.key;
        const dragKey = dragNode.key;
        const dropPos = node.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

        const data = [...treeData];
        const loop = (data: TreeNodeData[], key: string | undefined, callback: LoopCallback) => {
            data.forEach((item, ind, arr) => {
                if (item.key === key) return callback(item, ind, arr);
                if (item.children) return loop(item.children, key, callback);
            });
        };

        let dragObj: TreeNodeData = {};
        loop(data, dragKey, (item, ind, arr) => {
            arr.splice(ind, 1);
            dragObj = item;
        });

        if (!dropToGap) {
            loop(data, dropKey, (item) => {
                item.children = item.children || [];
                item.children.push(dragObj);
            });
        } else if (dropPosition === 1 && node.children && node.expanded) {
            loop(data, dropKey, (item) => {
                item.children = item.children || [];
                item.children.unshift(dragObj);
            });
        } else {
            let dropNodeInd = 0;
            let dropNodePosArr: TreeNodeData[] = [];
            loop(data, dropKey, (_item, ind, arr) => {
                dropNodePosArr = arr;
                dropNodeInd = ind;
            });
            if (dropPosition === -1) {
                dropNodePosArr.splice(dropNodeInd, 0, dragObj);
            } else {
                dropNodePosArr.splice(dropNodeInd + 1, 0, dragObj);
            }
        }
        setTreeData(data);
    };

    const findDescendantKeys = (node: TreeNodeData) => {
        const res = [node.key];
        const findChild = (item?: TreeNodeData) => {
            if (!item) return;
            const { children } = item;

            if (children && children.length) {
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

    return <Tree treeData={treeData} draggable onDrop={onDrop} renderFullLabel={renderLabel} onSelect={handleSelect} style={treeStyle} defaultExpandAll />;
}
