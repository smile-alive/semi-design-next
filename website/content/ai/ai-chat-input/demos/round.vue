<script setup lang="ts">
    import { ref } from 'vue';
    import { AIChatInput } from '@fibrae/semi-ai-vue';
    import { IconBookOpenStroked, IconFeishuLogo, IconGit, IconFigma } from '@fibrae/semi-icons-vue';
    import { RadioGroup, Radio, type RadioValue } from '@fibrae/semi-ui-vue';

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
    const mcpIcons = { feishu: IconFeishuLogo, github: IconGit, IconFigma };

    const radioButtonProps = [
        { label: '极速', value: 'fast' },
        { label: '思考', value: 'think' },
        { label: '超能', value: 'super' },
    ];

    // A Radio value of true cannot use the bare-attribute shorthand: the prop accepts strings, so it would be ''.
    const roundOptions = [
        { label: '圆形', value: true },
        { label: '方形', value: false },
    ];

    const round = ref<RadioValue | undefined>(false);
</script>

<template>
    <RadioGroup v-model="round" aria-label="单选组合示例" name="demo-radio-group">
        <Radio v-for="option in roundOptions" :key="option.label" :value="option.value">
            {{ option.label }}
        </Radio>
    </RadioGroup>
    <AIChatInput placeholder="下方按钮为方形的用例" :round="round === true" style="margin: 12px" :uploadProps="uploadProps">
        <template #configureArea>
            <AIChatInput.Configure.Select field="model" initValue="GPT-4o" :optionList="modelOptions" />
            <AIChatInput.Configure.Button field="onlineSearch">
                <template #icon>
                    <IconBookOpenStroked />
                </template>
                联网搜索
            </AIChatInput.Configure.Button>
            <AIChatInput.Configure.Mcp :options="mcpOptions">
                <template #optionIcon="optionIcon">
                    <component :is="mcpIcons[optionIcon.item.value as keyof typeof mcpIcons]" />
                </template>
            </AIChatInput.Configure.Mcp>
            <AIChatInput.Configure.RadioButton field="mode" initValue="fast" :options="radioButtonProps" />
        </template>
    </AIChatInput>
</template>
