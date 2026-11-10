<script lang="ts">
    import type { Component } from 'svelte';
    import { AIChatInput, type AIChatInputSetup as Setup } from '@fibrae/semi-ai-svelte';
    import { IconBookOpenStroked, IconGit, IconTemplateStroked, IconWord } from '@fibrae/semi-icons-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const uploadProps = { action: '/upload', customRequest: mockUpload };

    const modelOptions = [
        { value: 'GPT-5', label: 'GPT-5' },
        { value: 'GPT-4o', label: 'GPT-4o' },
        { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
    ];

    const mcpOptions = [
        { label: '办公文档', value: 'office' },
        { label: 'Github Mcp', value: 'github' },
        { label: 'Design Mcp', value: 'design' },
    ];
    const mcpIcons: Record<string, Component> = { office: IconWord, github: IconGit, design: IconTemplateStroked };

    const radioButtonProps = [
        { label: '极速', value: 'fast' },
        { label: '思考', value: 'think' },
        { label: '超能', value: 'super' },
    ];

    const onConfigureButtonClick = () => {
        console.log('onConfigureButtonClick');
    };

    const onConfigureChange = (value: Setup, changedValue?: Setup) => {
        console.log('onConfigureChange', value, changedValue);
    };
</script>

<AIChatInput {onConfigureChange} placeholder="用于查看左下方配置项的用例" style="margin: 12px" {uploadProps}>
    {#snippet configureArea()}
        <AIChatInput.Configure.Select field="model" initValue="GPT-4o" optionList={modelOptions} />
        <AIChatInput.Configure.Button field="onlineSearch">
            {#snippet icon()}
                <IconBookOpenStroked />
            {/snippet}
            联网搜索
        </AIChatInput.Configure.Button>
        <AIChatInput.Configure.Mcp {onConfigureButtonClick} options={mcpOptions} showConfigure>
            {#snippet optionIcon(optionIcon)}
                {@const Icon = mcpIcons[optionIcon.item.value]}
                <Icon />
            {/snippet}
        </AIChatInput.Configure.Mcp>
        <AIChatInput.Configure.RadioButton field="thinkType" initValue="fast" options={radioButtonProps} />
    {/snippet}
</AIChatInput>
