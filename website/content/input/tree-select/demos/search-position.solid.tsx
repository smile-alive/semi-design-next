import { TreeSelect } from '@fibrae/semi-ui-solid';

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

export default function TreeSelectDemo() {
    return (
        <>
            <TreeSelect searchPosition="trigger" style={{ width: '300px' }} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} filterTreeNode placeholder="单选" />
            <br />
            <br />
            <TreeSelect searchPosition="trigger" style={{ width: '300px' }} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} multiple filterTreeNode maxTagCount={2} placeholder="多选" />
        </>
    );
}
