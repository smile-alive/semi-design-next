import { Tree, Checkbox, type TreeProps } from '@fibrae/semi-ui-react';

const treeData = [
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
    width: 260,
    height: 420,
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const renderLabel: TreeProps['renderFullLabel'] = (row) => {
        const isLeaf = !(row.data.children && row.data.children.length);
        const handleClick = isLeaf ? row.onCheck : row.onExpand;
        // Focus stays on the tree (arrows expand, Enter/Space check), so the inline checkbox is display-only
        return (
            <li className={row.className} role="treeitem" onClick={handleClick}>
                {!isLeaf && row.expandIcon}
                {isLeaf && <Checkbox aria-hidden tabIndex={-1} indeterminate={row.checkStatus.halfChecked} checked={row.checkStatus.checked} style={{ marginRight: 8 }} />}
                <span>{row.data.label}</span>
            </li>
        );
    };

    return <Tree treeData={treeData} renderFullLabel={renderLabel} multiple leafOnly style={treeStyle} />;
}
