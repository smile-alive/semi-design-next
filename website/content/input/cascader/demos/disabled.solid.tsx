import { Cascader } from '@fibrae/semi-ui-solid';

const treeData = [
    {
        label: '浙江省',
        value: 'zhejiang',
        children: [
            {
                label: '杭州市',
                value: 'hangzhou',
                children: [
                    {
                        label: '西湖区',
                        value: 'xihu',
                    },
                    {
                        label: '萧山区',
                        value: 'xiaoshan',
                    },
                    {
                        label: '临安区',
                        value: 'linan',
                    },
                ],
            },
        ],
    },
];

export default function CascaderDemo() {
    return (
        <div>
            <Cascader style={{ width: '300px' }} treeData={treeData} placeholder="请选择所在地区" disabled />
            <br />
            <br />
            <Cascader style={{ width: '300px' }} treeData={treeData} placeholder="请选择所在地区" defaultValue={['zhejiang', 'hangzhou', 'xihu']} filterTreeNode disabled />
        </div>
    );
}
