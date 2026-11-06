import { type JSX, Show } from 'solid-js';
import { IconChevronDown, IconClose } from '@fibrae/semi-icons-solid';
import { Button, ButtonGroup, Cascader, type CascaderData, type CascaderTriggerRenderProps, Tag, TagInput } from '@fibrae/semi-ui-solid';

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

function getLabelFromValue(value: string) {
    const [first, ...rest] = value.split('-').map((item) => Number(item));
    let node: CascaderData | undefined = treeData[first];
    rest.forEach((item) => {
        node = node?.children?.[item];
    });
    return node?.label as JSX.Element | undefined;
}

// The clear button is a sibling of the trigger button: buttons cannot nest
const triggerRenderSingle = (trigger: CascaderTriggerRenderProps) => (
    <ButtonGroup theme="light">
        <Button icon={<IconChevronDown />} iconPosition="right">
            {trigger.value ? getLabelFromValue(trigger.value) : trigger.placeholder}
        </Button>
        <Show when={trigger.value}>
            <Button
                icon={<IconClose />}
                aria-label="清除"
                onClick={(e) => {
                    e.stopPropagation();
                    trigger.onClear(e);
                }}
            />
        </Show>
    </ButtonGroup>
);

const triggerRenderMultiple = (trigger: CascaderTriggerRenderProps<true>) => (
    <TagInput
        value={[...trigger.value]}
        onInputChange={(value) => trigger.onSearch(value)}
        renderTagItem={(value) => (
            <Tag tagKey={value} closable onClose={() => trigger.onRemove(value)} style={{ 'margin-inline-start': '2px' }}>
                {getLabelFromValue(value)}
            </Tag>
        )}
    />
);

export default function CascaderDemo() {
    return (
        <>
            <Cascader treeData={treeData} placeholder="Custom Trigger" triggerRender={triggerRenderSingle} />
            <br />
            <Cascader triggerRender={triggerRenderMultiple} multiple filterTreeNode treeData={treeData} style={{ width: '300px' }} placeholder="Custom Trigger" />
        </>
    );
}
