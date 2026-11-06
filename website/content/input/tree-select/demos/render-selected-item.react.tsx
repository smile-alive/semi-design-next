import { TreeSelect, Tag } from '@fibrae/semi-ui-react';

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
    {
        label: '南美洲',
        value: 'South America',
        key: '2',
    },
    {
        label: '南极洲',
        value: 'Antarctica',
        key: '3',
    },
];

export default function TreeSelectDemo() {
    return (
        <>
            <h4>单选</h4>
            <TreeSelect style={{ width: 300 }} treeData={treeData} renderSelectedItem={(item) => item.label} />
            <h4>多选+ isRenderInTag=true</h4>
            <TreeSelect style={{ width: 300 }} treeData={treeData} multiple renderSelectedItem={(item) => ({ content: item.label, isRenderInTag: true })} />
            <h4>多选 + isRenderInTag=false</h4>
            <TreeSelect
                style={{ width: 300 }}
                treeData={treeData}
                multiple
                maxTagCount={2}
                renderSelectedItem={(item, selected) => ({
                    content: (
                        <Tag color="white" closable onClose={selected.onClose}>
                            {item.value}
                        </Tag>
                    ),
                    isRenderInTag: false,
                })}
            />
        </>
    );
}
