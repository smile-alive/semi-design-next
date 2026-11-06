import { TreeSelect, Tag, TagInput, type TreeNodeData, type TreeSelectTriggerRenderProps } from '@fibrae/semi-ui-react';

const treeData: TreeNodeData[] = [
    {
        label: '亚洲',
        value: '亚洲',
        key: '0',
        children: [
            {
                label: '中国',
                value: '中国',
                key: '0-0',
                children: [
                    {
                        label: '北京',
                        value: '北京',
                        key: '0-0-0',
                    },
                    {
                        label: '上海',
                        value: '上海',
                        key: '0-0-1',
                    },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: '北美洲',
        key: '1',
    },
];

const onChange = (value: unknown) => {
    console.log('onChange', value);
};

const renderTrigger = (triggerState: TreeSelectTriggerRenderProps) => (
    <TagInput
        value={triggerState.value.flatMap<string>((item) => item.key ?? [])}
        inputValue={triggerState.inputValue}
        onInputChange={triggerState.onSearch}
        renderTagItem={(key) => (
            <Tag style={{ marginInlineStart: 2 }} tagKey={key} closable onClose={() => triggerState.onRemove(key)}>
                {triggerState.value.find((item) => item.key === key)?.label}
            </Tag>
        )}
    />
);

export default function TreeSelectDemo() {
    return <TreeSelect triggerRender={renderTrigger} filterTreeNode searchPosition="trigger" multiple treeData={treeData} placeholder="Custom Trigger" onChange={onChange} style={{ width: 300 }} />;
}
