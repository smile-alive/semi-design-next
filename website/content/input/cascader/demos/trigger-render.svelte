<script lang="ts">
    import { IconChevronDown, IconClose } from '@fibrae/semi-icons-svelte';
    import { Button, ButtonGroup, Cascader, Tag, TagInput, type CascaderData } from '@fibrae/semi-ui-svelte';

    const treeData: CascaderData[] = [
        {
            label: '浙江省',
            value: 'zhejiang',
            children: [
                {
                    label: '杭州市',
                    value: 'hangzhou',
                    children: [
                        { label: '西湖区', value: 'xihu' },
                        { label: '萧山区', value: 'xiaoshan' },
                        { label: '临安区', value: 'linan' },
                    ],
                },
                {
                    label: '宁波市',
                    value: 'ningbo',
                    children: [
                        { label: '海曙区', value: 'haishu' },
                        { label: '江北区', value: 'jiangbei' },
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
</script>

{#snippet chevron()}
    <IconChevronDown />
{/snippet}

{#snippet close()}
    <IconClose />
{/snippet}

<Cascader placeholder="Custom Trigger" {treeData}>
    {#snippet trigger({ value, placeholder, onClear })}
        <!-- The clear button is a sibling of the trigger button: buttons cannot nest -->
        <ButtonGroup theme="light">
            <Button icon={chevron} iconPosition="right">
                {value ? getLabelFromValue(value as string) : placeholder}
            </Button>
            {#if value}
                <Button
                    aria-label="清除"
                    icon={close}
                    onclick={(event) => {
                        event.stopPropagation();
                        onClear(event);
                    }}
                />
            {/if}
        </ButtonGroup>
    {/snippet}
</Cascader>
<br />
<Cascader filterTreeNode multiple placeholder="Custom Trigger" style="width: 300px" {treeData}>
    {#snippet trigger({ value, onSearch, onRemove })}
        <TagInput onInputChange={onSearch} value={Array.from(value as Set<string>)}>
            {#snippet tag({ value: pos })}
                <Tag
                    closable
                    onClose={(event) => {
                        event.preventDefault();
                        onRemove(pos);
                    }}
                    style="margin-left: 2px"
                    tagKey={pos}
                >
                    {getLabelFromValue(pos)}
                </Tag>
            {/snippet}
        </TagInput>
    {/snippet}
</Cascader>
