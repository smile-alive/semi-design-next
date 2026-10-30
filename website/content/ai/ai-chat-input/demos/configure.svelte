<script lang="ts">
    import type { Component } from 'svelte';
    import { AIChatInput, type AIChatInputLeftMenuChangeProps as LeftMenuChangeProps } from '@fibrae/semi-ai-svelte';
    import { IconBookOpenStroked, IconFeishuLogo, IconFigma, IconGit } from '@fibrae/semi-icons-svelte';

    const { Configure } = AIChatInput;
    const uploadProps = { action: 'https://api.semi.design/upload' };

    const modelOptions = [
        { value: 'GPT-5', label: 'GPT-5' },
        { value: 'GPT-4o', label: 'GPT-4o' },
        { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
    ];

    const mcpOptions = [
        { label: '飞书文档', value: 'feishu' },
        { label: 'Github Mcp', value: 'github' },
        { label: 'IconFigma Mcp', value: 'IconFigma' },
    ];
    const mcpIcons: Record<string, Component> = { feishu: IconFeishuLogo, github: IconGit, IconFigma };

    const radioButtonProps = [
        { label: '极速', value: 'fast' },
        { label: '思考', value: 'think' },
        { label: '超能', value: 'super' },
    ];

    const onConfigureButtonClick = () => {
        console.log('onConfigureButtonClick');
    };

    const onConfigureChange = (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => {
        console.log('onConfigureChange', value, changedValue);
    };
</script>

<AIChatInput {onConfigureChange} placeholder="用于查看左下方配置项的用例" style="margin: 12px" {uploadProps}>
    {#snippet configureArea()}
        <Configure.Select field="model" initValue="GPT-4o" optionList={modelOptions} />
        <Configure.Button field="onlineSearch">
            {#snippet icon()}
                <IconBookOpenStroked />
            {/snippet}
            联网搜索
        </Configure.Button>
        <Configure.Mcp {onConfigureButtonClick} options={mcpOptions} showConfigure>
            {#snippet optionIcon({ item })}
                {@const Icon = mcpIcons[item.value]}
                <Icon />
            {/snippet}
        </Configure.Mcp>
        <Configure.RadioButton field="thinkType" initValue="fast" options={radioButtonProps} />
    {/snippet}
</AIChatInput>
