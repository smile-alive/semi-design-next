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
                ],
            },
            {
                label: '宁波市',
                value: 'ningbo',
                children: [
                    {
                        label: '海曙区',
                        value: 'haishu',
                    },
                ],
            },
        ],
    },
];

export default function CascaderDemo() {
    return <Cascader style={{ width: '300px' }} treeData={treeData} multiple placeholder="请选择所在地区" showNext="hover" clickToSelect />;
}
