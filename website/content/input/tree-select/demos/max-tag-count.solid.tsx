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
                    {
                        label: 'Chengdu',
                        value: 'Chengdu',
                        key: '0-0-2',
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

const textStyle = { margin: '20px 0 10px' };

export default function TreeSelectDemo() {
    return (
        <div>
            <h4 style={textStyle}>maxTagCount=2:</h4>
            <TreeSelect multiple maxTagCount={2} style={{ width: '300px' }} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} placeholder="当选中标签超过两个将折叠" defaultValue={['Beijing', 'Chengdu', 'Canada']} />
            <h4 style={textStyle}>maxTagCount=2, showRestTagsPopover:</h4>
            <TreeSelect showRestTagsPopover restTagsPopoverProps={{ position: 'top' }} multiple maxTagCount={2} style={{ width: '300px' }} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} placeholder="hover +N 查看" defaultValue={['Beijing', 'Chengdu', 'Canada']} />
        </div>
    );
}
