import { useCallback } from 'react';
import { IconClose, IconChevronDown } from '@fibrae/semi-icons-react';
import { Cascader, Button, ButtonGroup, Tag, TagInput, type CascaderData, type CascaderTriggerRenderProps, type TagProps } from '@fibrae/semi-ui-react';

const treeData: CascaderData[] = [
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

const getLabelFromValue = (value: string) => {
    const [first, ...rest] = value.split('-').map((item) => Number(item));
    let node: CascaderData | undefined = treeData[first];
    rest.forEach((item) => {
        node = node?.children?.[item];
    });
    return node?.label;
};

export default function CascaderDemo() {
    const triggerRenderSingle = ({ value, placeholder, onClear }: CascaderTriggerRenderProps) => {
        // The clear button is a sibling of the trigger button: buttons cannot nest
        return (
            <ButtonGroup theme="light">
                <Button icon={<IconChevronDown />} iconPosition="right">
                    {value && value.length > 0 ? getLabelFromValue(value) : placeholder}
                </Button>
                {Boolean(value) && (
                    <Button
                        icon={<IconClose />}
                        aria-label="清除"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear(e);
                        }}
                    />
                )}
            </ButtonGroup>
        );
    };

    const triggerRenderMultiple = useCallback(({ value, onSearch, onRemove }: CascaderTriggerRenderProps<true>) => {
        const onCloseTag: TagProps['onClose'] = (_value, _e, tagKey) => {
            onRemove(String(tagKey));
        };

        const renderTagItem = (value: string) => {
            const label = getLabelFromValue(value);
            return (
                <Tag tagKey={value} key={value} closable onClose={onCloseTag} style={{ marginLeft: 2 }}>
                    {label}
                </Tag>
            );
        };

        return <TagInput value={Array.from(value)} onInputChange={onSearch} renderTagItem={renderTagItem} />;
    }, []);

    return (
        <>
            <Cascader treeData={treeData} placeholder="Custom Trigger" triggerRender={triggerRenderSingle} />
            <br />
            <Cascader triggerRender={triggerRenderMultiple} multiple filterTreeNode treeData={treeData} style={{ width: 300 }} placeholder="Custom Trigger" />
        </>
    );
}
