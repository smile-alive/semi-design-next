<script setup lang="ts">
    import type { Component } from 'vue';
    import { AIChatInput, type AIChatInputLeftMenuChangeProps as LeftMenuChangeProps } from '@fibrae/semi-ai-vue';
    import { IconBookOpenStroked, IconFeishuLogo, IconGit, IconFigma } from '@fibrae/semi-icons-vue';

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

<template>
    <AIChatInput placeholder="用于查看左下方配置项的用例" style="margin: 12px" :uploadProps="uploadProps" @configureChange="onConfigureChange">
        <template #configureArea>
            <Configure.Select field="model" initValue="GPT-4o" :optionList="modelOptions" />
            <Configure.Button field="onlineSearch">
                <template #icon>
                    <IconBookOpenStroked />
                </template>
                联网搜索
            </Configure.Button>
            <Configure.Mcp :options="mcpOptions" showConfigure @configureButtonClick="onConfigureButtonClick">
                <template #optionIcon="{ item }">
                    <component :is="mcpIcons[item.value]" />
                </template>
            </Configure.Mcp>
            <Configure.RadioButton field="thinkType" initValue="fast" :options="radioButtonProps" />
        </template>
    </AIChatInput>
</template>
