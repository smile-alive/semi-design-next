<script setup lang="ts">
    import { ref } from 'vue';
    import { AIChatInput } from '@fibrae/semi-ai-vue';
    import { IconBookOpenStroked, IconFeishuLogo, IconGit, IconFigma } from '@fibrae/semi-icons-vue';
    import { RadioGroup, Radio, type RadioValue } from '@fibrae/semi-ui-vue';

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
    const mcpIcons = { feishu: IconFeishuLogo, github: IconGit, IconFigma };

    const radioButtonProps = [
        { label: '极速', value: 'fast' },
        { label: '思考', value: 'think' },
        { label: '超能', value: 'super' },
    ];

    const shape = ref<RadioValue | undefined>('square');
</script>

<template>
    <RadioGroup v-model="shape" aria-label="单选组合示例" name="demo-radio-group">
        <Radio value="round">圆形</Radio>
        <Radio value="square">方形</Radio>
    </RadioGroup>
    <AIChatInput placeholder="下方按钮为方形的用例" :round="shape === 'round'" style="margin: 12px" :uploadProps="uploadProps">
        <template #configureArea>
            <Configure.Select field="model" initValue="GPT-4o" :optionList="modelOptions" />
            <Configure.Button field="onlineSearch">
                <template #icon>
                    <IconBookOpenStroked />
                </template>
                联网搜索
            </Configure.Button>
            <Configure.Mcp :options="mcpOptions">
                <template #optionIcon="{ item }">
                    <component :is="mcpIcons[item.value as keyof typeof mcpIcons]" />
                </template>
            </Configure.Mcp>
            <Configure.RadioButton field="mode" initValue="fast" :options="radioButtonProps" />
        </template>
    </AIChatInput>
</template>
