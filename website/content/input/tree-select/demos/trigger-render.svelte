<script lang="ts">
    import { Tag, TagInput, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-svelte';

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
                        { label: '北京', value: '北京', key: '0-0-0' },
                        { label: '上海', value: '上海', key: '0-0-1' },
                    ],
                },
            ],
        },
        { label: '北美洲', value: '北美洲', key: '1' },
    ];

    const onChange = (value: unknown) => {
        console.log('onChange', value);
    };
</script>

<TreeSelect filterTreeNode multiple {onChange} placeholder="Custom Trigger" searchPosition="trigger" style="width: 300px" {treeData}>
    {#snippet trigger(triggerState)}
        <TagInput inputValue={triggerState.inputValue} onInputChange={triggerState.onSearch} value={triggerState.value.flatMap((item) => item.key ?? [])}>
            {#snippet tag(tagItem)}
                <Tag closable onClose={() => triggerState.onRemove(tagItem.value)} style="margin-inline-start: 2px" tagKey={tagItem.value}>
                    {triggerState.value.find((item) => item.key === tagItem.value)?.label}
                </Tag>
            {/snippet}
        </TagInput>
    {/snippet}
</TreeSelect>
