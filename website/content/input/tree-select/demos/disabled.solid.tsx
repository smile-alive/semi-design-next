import { TreeSelect } from '@fibrae/semi-ui-solid';

const treeData = [
    {
        label: '亚洲',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: '中国',
                value: 'China',
                key: '0-0',
                children: [
                    {
                        label: '北京',
                        value: 'Beijing',
                        key: '0-0-0',
                    },
                    {
                        label: '上海',
                        value: 'Shanghai',
                        key: '0-0-1',
                    },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: '1',
    },
];

export default function TreeSelectDemo() {
    return (
        <div>
            <TreeSelect style={{ width: '300px' }} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} disabled placeholder="禁用下拉菜单" />
            <br />
            <br />
            <TreeSelect style={{ width: '300px' }} defaultValue="Shanghai" dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} disabled />
            <br />
            <br />
            <TreeSelect style={{ width: '300px' }} defaultValue={['Shanghai', 'North America']} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} multiple disabled />
        </div>
    );
}
