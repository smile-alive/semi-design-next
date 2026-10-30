import { createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { IconAbsoluteStroked, IconComponentStroked, IconFixedStroked, IconSectionStroked } from '@fibrae/semi-icons-solid';
import { Tree, type TreeNodeData, type TreeOnDragProps, type TreeRenderFullLabelProps } from '@fibrae/semi-ui-solid';

const icons: Record<string, typeof IconFixedStroked> = {
    'fix-btn-0': IconFixedStroked,
    'module-0': IconSectionStroked,
    'free-compo-0': IconAbsoluteStroked,
    'split-col-0': IconSectionStroked,
    'btn-0': IconComponentStroked,
    'btn-1': IconComponentStroked,
    'module-1': IconSectionStroked,
    'cus-0': IconComponentStroked,
};

type LoopCallback = (item: TreeNodeData, ind: number, arr: TreeNodeData[]) => void;

function findDescendantKeys(node: TreeNodeData) {
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
}

const treeStyle = {
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const [selected, setSelected] = createSignal(new Set<string | undefined>());
    const [selectedThroughParent, setSelectedThroughParent] = createSignal(new Set<string | undefined>());
    const iconStyle = { 'margin-right': '8px', color: 'var(--semi-color-text-2)' };
    const defaultTreeData: TreeNodeData[] = [
        {
            label: '黑色固定按钮',
            key: 'fix-btn-0',
        },
        {
            label: '模块',
            key: 'module-0',
            children: [
                {
                    label: '可自由摆放的组件',
                    key: 'free-compo-0',
                },
                {
                    label: '分栏容器',
                    key: 'split-col-0',
                    children: [
                        {
                            label: '按钮组件',
                            key: 'btn-0',
                        },
                        {
                            label: '按钮组件',
                            key: 'btn-1',
                        },
                    ],
                },
            ],
        },
        {
            label: '模块',
            key: 'module-1',
            children: [
                {
                    label: '自定义组件',
                    key: 'cus-0',
                },
            ],
        },
    ];
    const [treeData, setTreeData] = createSignal<TreeNodeData[]>(defaultTreeData);

    const onDrop = (info: TreeOnDragProps) => {
        const { dropToGap, node, dragNode } = info;
        const dropKey = node.key;
        const dragKey = dragNode.key;
        const dropPos = node.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

        const data = [...treeData()];
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

    const handleSelect = (key: string, _bool: boolean, node: TreeNodeData) => {
        setSelected(new Set([key]));
        const descendantKeys = findDescendantKeys(node);
        setSelectedThroughParent(new Set(descendantKeys));
    };

    const backgroundOf = (key?: string) => (selected().has(key) ? 'var(--semi-blue-0)' : selectedThroughParent().has(key) ? 'rgb(from var(--semi-blue-0) r g b / .5)' : 'transparent');

    const renderLabel = (row: TreeRenderFullLabelProps) => (
        <div class={row.class} onClick={row.onClick} style={{ 'background-color': backgroundOf(row.data.key) }}>
            {row.data.children && row.data.children.length ? row.expandIcon() : <span style={{ width: '24px' }} />}
            <Dynamic component={icons[row.data.key ?? '']} style={iconStyle} />
            <span>{row.data.label}</span>
        </div>
    );

    return <Tree treeData={treeData()} draggable onDrop={onDrop} renderFullLabel={renderLabel} onSelect={handleSelect} style={treeStyle} defaultExpandAll />;
}
