import { Cascader } from '@fibrae/semi-ui-react';

export default function CascaderDemo() {
    const treeData = [
        {
            label: 'A',
            value: 'A',
            children: [
                {
                    label: 'B',
                    value: 'B',
                    children: [
                        {
                            label: 'C',
                            value: 'C',
                            children: [
                                {
                                    label: 'D',
                                    value: 'D',
                                    children: [
                                        {
                                            label: 'E',
                                            value: 'E',
                                            children: [
                                                {
                                                    label: 'F',
                                                    value: 'F',
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ];
    return <Cascader dropdownClassName="components-cascader-demo" style={{ width: 300 }} treeData={treeData} placeholder="请选择所在地区" />;
}
