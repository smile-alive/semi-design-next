import { IconMapPinStroked } from '@fibrae/semi-icons-solid';
import { Cascader, type CascaderData, Typography } from '@fibrae/semi-ui-solid';

// The label inside an option must not be focusable, so the node only adds a decorative icon to the text
const renderLabel = (item: CascaderData) => (
    <span style={{ display: 'inline-flex', 'align-items': 'center', 'column-gap': '4px' }}>
        <IconMapPinStroked />
        {item.label}
    </span>
);

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

export default function CascaderDemo() {
    return (
        <div>
            <Cascader style={{ width: '300px' }} treeData={treeData} placeholder="默认对label值进行搜索" filterTreeNode />
            <br />
            <br />
            <Cascader style={{ width: '300px' }} treeData={treeData} placeholder="对value值进行搜索" filterTreeNode treeNodeFilterProp="value" />
            <br />
            <br />
            <Typography.Title heading={6}>filterLeafOnly=false:</Typography.Title>
            <Cascader style={{ width: '300px' }} treeData={treeData} placeholder="filterLeafOnly=false" filterTreeNode filterLeafOnly={false} />
            <br />
            <br />
            <Typography.Title heading={6}>renderLabel 自定义选项内容，仍对 label 文本进行搜索</Typography.Title>
            <Cascader style={{ width: '300px' }} treeData={treeData} placeholder="renderLabel" filterTreeNode renderLabel={renderLabel} />
        </div>
    );
}
