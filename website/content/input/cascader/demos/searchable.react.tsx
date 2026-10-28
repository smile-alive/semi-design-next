import { IconMapPinStroked } from '@fibrae/semi-icons-react';
import { Cascader, Typography } from '@fibrae/semi-ui-react';

// The label inside an option must not be focusable, so the node only adds a decorative icon to the text
const labelNode = (text: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', columnGap: 4 }}>
        <IconMapPinStroked />
        {text}
    </span>
);

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
                {
                    label: '宁波市',
                    value: 'ningbo',
                    children: [
                        {
                            label: '海曙区',
                            value: 'haishu',
                        },
                        {
                            label: '江北区',
                            value: 'jiangbei',
                        },
                    ],
                },
            ],
        },
    ];
    const labelNodeTreeData = [
        {
            label: labelNode('浙江省'),
            labelText: '浙江省',
            value: 'zhejiang',
            children: [
                {
                    label: labelNode('杭州市'),
                    labelText: '杭州市',
                    value: 'hangzhou',
                    children: [
                        {
                            label: labelNode('西湖区'),
                            labelText: '西湖区',
                            value: 'xihu',
                        },
                        {
                            label: labelNode('萧山区'),
                            labelText: '萧山区',
                            value: 'xiaoshan',
                        },
                        {
                            label: labelNode('临安区'),
                            labelText: '临安区',
                            value: 'linan',
                        },
                    ],
                },
                {
                    label: labelNode('宁波市'),
                    labelText: '宁波市',
                    value: 'ningbo',
                    children: [
                        {
                            label: labelNode('海曙区'),
                            labelText: '海曙区',
                            value: 'haishu',
                        },
                        {
                            label: labelNode('江北区'),
                            labelText: '江北区',
                            value: 'jiangbei',
                        },
                    ],
                },
            ],
        },
    ];

    return (
        <div>
            <Cascader style={{ width: 300 }} treeData={treeData} placeholder="默认对label值进行搜索" filterTreeNode />
            <br />
            <br />
            <Cascader style={{ width: 300 }} treeData={treeData} placeholder="对value值进行搜索" filterTreeNode treeNodeFilterProp="value" />
            <br />
            <br />
            <Typography.Title heading={6}>filterLeafOnly=false:</Typography.Title>
            <Cascader style={{ width: 300 }} treeData={treeData} placeholder="filterLeafOnly=false" filterTreeNode filterLeafOnly={false} />
            <br />
            <br />
            <Typography.Title heading={6}>Label 为自定义节点，指定其他属性进行搜索</Typography.Title>
            <Cascader style={{ width: 300 }} treeData={labelNodeTreeData} placeholder="Search for labelText" filterTreeNode treeNodeFilterProp="labelText" displayProp="labelText" />
        </div>
    );
}
