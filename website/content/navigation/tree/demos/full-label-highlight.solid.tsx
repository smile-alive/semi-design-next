import { createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { IconAbsoluteStroked, IconComponentStroked, IconFixedStroked, IconInnerSectionStroked, IconSectionStroked } from '@fibrae/semi-icons-solid';
import { Tree, type TreeNodeData, type TreeRenderFullLabelProps } from '@fibrae/semi-ui-solid';

const icons: Record<string, typeof IconFixedStroked> = {
    'fix-btn-0': IconFixedStroked,
    'module-0': IconSectionStroked,
    'free-compo-0': IconAbsoluteStroked,
    'split-col-0': IconInnerSectionStroked,
    'btn-0': IconComponentStroked,
    'btn-1': IconComponentStroked,
    'module-1': IconSectionStroked,
    'cus-0': IconComponentStroked,
};

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
    const treeData: TreeNodeData[] = [
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

    return <Tree treeData={treeData} renderFullLabel={renderLabel} onSelect={handleSelect} style={treeStyle} defaultExpandAll />;
}
