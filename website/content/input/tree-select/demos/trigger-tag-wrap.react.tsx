import { TreeSelect } from '@fibrae/semi-ui-react';

export default function TreeSelectDemo() {
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
                            label: 'Shenzhen',
                            value: 'Shenzhen',
                            key: '0-0-2',
                        },
                        {
                            label: 'Guangzhou',
                            value: 'Guangzhou',
                            key: '0-0-3',
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

    return <TreeSelect searchPosition="trigger" triggerTagWrap style={{ width: 260 }} dropdownStyle={{ maxHeight: 400, overflow: 'auto' }} treeData={treeData} multiple filterTreeNode placeholder="请选择多个选项或输入长文本" defaultValue={['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou']} />;
}
