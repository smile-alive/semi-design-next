<script lang="ts">
    import type { Component } from 'svelte';
    import { AIChatInput } from '@fibrae/semi-ai-svelte';
    import { IconBookOpenStroked, IconFeishuLogo, IconFigma, IconGit } from '@fibrae/semi-icons-svelte';
    import { Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-svelte';

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

    let round = $state<RadioValue | undefined>(false);
</script>

<RadioGroup aria-label="单选组合示例" bind:value={round} name="demo-radio-group">
    <Radio value={true}>圆形</Radio>
    <Radio value={false}>方形</Radio>
</RadioGroup>
<AIChatInput placeholder="下方按钮为方形的用例" round={round === true} style="margin: 12px" {uploadProps}>
    {#snippet configureArea()}
        <AIChatInput.Configure.Select field="model" initValue="GPT-4o" optionList={modelOptions} />
        <AIChatInput.Configure.Button field="onlineSearch">
            {#snippet icon()}
                <IconBookOpenStroked />
            {/snippet}
            联网搜索
        </AIChatInput.Configure.Button>
        <AIChatInput.Configure.Mcp options={mcpOptions}>
            {#snippet optionIcon(optionIcon)}
                {@const Icon = mcpIcons[optionIcon.item.value]}
                <Icon />
            {/snippet}
        </AIChatInput.Configure.Mcp>
        <AIChatInput.Configure.RadioButton field="mode" initValue="fast" options={radioButtonProps} />
    {/snippet}
</AIChatInput>
