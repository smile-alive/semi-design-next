<script setup lang="ts">
    import { onMounted, ref, useTemplateRef } from 'vue';
    import { AIChatDialogue, type AIChatDialogueHandle, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-vue';
    import { Radio, RadioGroup } from '@fibrae/semi-ui-vue';

    const messages: Message[] = [
        {
            role: 'system',
            id: '1',
            createdAt: 1715676751919,
            content: "Hello, I'm your AI assistant.",
        },
        {
            role: 'user',
            id: '2',
            createdAt: 1715676751919,
            content: '给一个 Semi Design 的 Button 组件的使用示例',
        },
        {
            role: 'assistant',
            id: '3',
            createdAt: 1715676751919,
            content: "以下是一个 Semi 代码的使用示例：\n```jsx \nimport React from 'react';\nimport { Button } from '@fibrae/semi-ui-react';\n\nconst MyComponent = () => {\n  return (\n    <Button>Click me</Button>\n );\n};\nexport default MyComponent;\n```\n",
        },
    ];

    const roleConfig = {
        user: {
            name: 'User',
            avatar: '/assets/docs-icon.png',
        },
        assistant: {
            name: 'Assistant',
            avatar: '/assets/placeholder/logo.svg',
        },
        system: {
            name: 'System',
            avatar: '/assets/placeholder/logo.svg',
        },
    };

    // A Radio value of true cannot use the bare-attribute shorthand: the prop accepts strings, so it would be ''.
    const selectOptions = [
        { label: '开启', value: true },
        { label: '关闭', value: false },
    ];

    const dialogue = useTemplateRef<AIChatDialogueHandle>('dialogue');
    const align = ref<'leftRight' | 'leftAlign'>('leftRight');
    const select = ref(true);
    const selection = ref<'allSelect' | 'cancelSelect'>('allSelect');

    onMounted(() => dialogue.value?.selectAll());

    const onSelectionChange = (value: unknown) => {
        if (value === 'allSelect') {
            dialogue.value?.selectAll();
            selection.value = value;
        } else if (value === 'cancelSelect') {
            dialogue.value?.deselectAll();
            selection.value = value;
        }
    };

    const onAlignChange = (value: unknown) => {
        if (value === 'leftRight' || value === 'leftAlign') align.value = value;
    };

    const onSelectChange = (value: unknown) => {
        if (typeof value === 'boolean') select.value = value;
    };

    const onSelect = (selectionId: string[]) => {
        console.log('onSelect', selectionId);
    };
</script>

<template>
    <div>
        <span :style="{ display: 'flex', flexDirection: 'column', rowGap: '8px' }">
            <span :style="{ display: 'flex', alignItems: 'center', columnGap: '10px' }">
                会话布局方式
                <RadioGroup :modelValue="align" type="button" @update:modelValue="onAlignChange">
                    <Radio value="leftRight">左右分布</Radio>
                    <Radio value="leftAlign">左对齐</Radio>
                </RadioGroup>
            </span>
            <span :style="{ display: 'flex', alignItems: 'center', columnGap: '10px' }">
                是否开启选择
                <RadioGroup :modelValue="select" type="button" @update:modelValue="onSelectChange">
                    <Radio v-for="option in selectOptions" :key="option.label" :value="option.value">
                        {{ option.label }}
                    </Radio>
                </RadioGroup>
            </span>
            <span :style="{ display: 'flex', alignItems: 'center', columnGap: '10px' }">
                选择方式
                <RadioGroup :modelValue="selection" type="button" @update:modelValue="onSelectionChange">
                    <Radio value="allSelect">全选</Radio>
                    <Radio value="cancelSelect">取消全选</Radio>
                </RadioGroup>
            </span>
        </span>

        <div
            :style="{
                border: '1px solid var(--semi-color-border)',
                borderRadius: '12px',
                marginTop: '10px',
                padding: '20px',
            }"
        >
            <AIChatDialogue ref="dialogue" :align="align" :chats="messages" mode="bubble" :roleConfig="roleConfig" :selecting="select" @select="onSelect" />
        </div>
    </div>
</template>
