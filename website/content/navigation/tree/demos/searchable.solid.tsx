import { createSignal } from 'solid-js';
import { Switch, Tree, type TreeNodeData } from '@fibrae/semi-ui-solid';

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

const style = {
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const [showFilteredOnly, setShowFilteredOnly] = createSignal(false);

    return (
        <>
            <span id="tree-searchable-filtered-only">showFilteredOnly</span>
            <Switch aria-labelledby="tree-searchable-filtered-only" checked={showFilteredOnly()} onChange={(checked) => setShowFilteredOnly(checked)} size="small" />
            <br />
            <Tree treeData={treeData} multiple filterTreeNode showFilteredOnly={showFilteredOnly()} style={style} />
        </>
    );
}
