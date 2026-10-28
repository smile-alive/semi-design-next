import { useCallback, useMemo } from 'react';
import { TreeSelect, Tag, TagInput, type TagProps, type TreeSelectTriggerRenderProps } from '@fibrae/semi-ui-react';

export default function TreeSelectDemo() {
    const treeData = useMemo(
        () => [
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
        ],
        []
    );

    const onValueChange = useCallback((value: unknown) => {
        console.log('onChange', value);
    }, []);

    const renderTrigger = useCallback(({ value, onSearch, onRemove, inputValue }: TreeSelectTriggerRenderProps) => {
        const tagInputValue = value.flatMap<string>((item) => item.key ?? []);
        const renderTagInMultiple = (key: string) => {
            const label = value.find((item) => item.key === key)?.label;
            const onCloseTag: TagProps['onClose'] = () => {
                onRemove(key);
            };
            return (
                <Tag style={{ marginLeft: 2 }} tagKey={key} key={key} onClose={onCloseTag} closable>
                    {label}
                </Tag>
            );
        };
        return <TagInput inputValue={inputValue} value={tagInputValue} onInputChange={onSearch} renderTagItem={renderTagInMultiple} />;
    }, []);

    return <TreeSelect triggerRender={renderTrigger} filterTreeNode searchPosition="trigger" multiple treeData={treeData} placeholder="Custom Trigger" onChange={onValueChange} style={{ width: 300 }} />;
}
