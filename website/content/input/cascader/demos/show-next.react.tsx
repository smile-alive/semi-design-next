import { Cascader } from '@fibrae/semi-ui-react';

export default function CascaderDemo() {
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
    return <Cascader style={{ width: 300 }} treeData={treeData} placeholder="请选择所在地区" showNext="hover" />;
}
