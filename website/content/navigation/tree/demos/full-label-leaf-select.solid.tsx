import { Tree, type TreeNodeData, type TreeRenderFullLabelProps } from '@fibrae/semi-ui-solid';

const isLeaf = (row: TreeRenderFullLabelProps) => !(row.data.children && row.data.children.length);

const renderLabel = (row: TreeRenderFullLabelProps) => (
    <div class={row.class} onClick={(e) => (isLeaf(row) ? row.onClick(e) : row.onExpand(e))}>
        {row.expandIcon()}
        <span>{row.data.label}</span>
    </div>
);

const treeData: TreeNodeData[] = [
    {
        label: 'Asia',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: 'China',
                value: 'China',
                key: '0-0',
                children: [
                    {
                        label: 'Beijing',
                        value: 'Beijing',
                        key: '0-0-0',
                    },
                    {
                        label: 'Shanghai',
                        value: 'Shanghai',
                        key: '0-0-1',
                    },
                ],
            },
            {
                label: 'Japan',
                value: 'Japan',
                key: '0-1',
                children: [
                    {
                        label: 'Osaka',
                        value: 'Osaka',
                        key: '0-1-0',
                    },
                ],
            },
        ],
    },
    {
        label: 'North America',
        value: 'North America',
        key: '1',
        children: [
            {
                label: 'United States',
                value: 'United States',
                key: '1-0',
            },
            {
                label: 'Canada',
                value: 'Canada',
                key: '1-1',
            },
        ],
    },
];

const treeStyle = {
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    return <Tree treeData={treeData} renderFullLabel={renderLabel} style={treeStyle} onChange={(...args) => console.log('change', ...args)} />;
}
