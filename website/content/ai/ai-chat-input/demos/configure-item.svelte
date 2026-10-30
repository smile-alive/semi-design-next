<script lang="ts">
    import { AIChatInput, type AIChatInputLeftMenuChangeProps as LeftMenuChangeProps } from '@fibrae/semi-ai-svelte';
    import { Cascader } from '@fibrae/semi-ui-svelte';

    const uploadProps = { action: 'https://api.semi.design/upload' };
    const cascaderModalOptions = [
        {
            label: 'GPT',
            value: 'GPT',
            children: [
                { label: 'GPT-4o', value: 'GPT-4o' },
                { value: 'GPT-5', label: 'GPT-5' },
            ],
        },
        {
            label: 'Claude',
            value: 'Claude',
            children: [{ label: 'Claude 3.5 Sonnet', value: 'Claude 3.5 Sonnet' }],
        },
    ];

    const onConfigureChange = (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => {
        console.log('onConfigureChange', value, changedValue);
    };
</script>

<AIChatInput {onConfigureChange} placeholder="用于查看左下方配置项的用例" style="margin: 12px" {uploadProps}>
    {#snippet configureArea()}
        <AIChatInput.Configure.Item baseClass="aiChatInput-cascader-configure" component={Cascader} field="model" initValue={['GPT', 'GPT-4o']} treeData={cascaderModalOptions} />
    {/snippet}
</AIChatInput>
