import { Cascader } from '@fibrae/semi-ui-solid';

const treeData = [
    {
        label: '亚洲',
        value: 'Asia',
        children: [
            {
                label: '中国',
                value: 'China',
                children: [
                    {
                        label: '北京',
                        value: 'Beijing',
                    },
                    {
                        label: '上海',
                        value: 'Shanghai',
                    },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
    },
];

export default function CascaderDemo() {
    return <Cascader multiple defaultValue={[['Asia'], ['Asia', 'China', 'Beijing']]} checkRelation="unRelated" style={{ width: '300px' }} treeData={treeData} />;
}
