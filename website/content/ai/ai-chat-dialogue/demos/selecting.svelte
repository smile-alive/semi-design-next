<script lang="ts">
    import { onMount } from 'svelte';
    import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-svelte';
    import { Radio, RadioGroup, type RadioChangeEvent } from '@fibrae/semi-ui-svelte';

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

    let dialogue = $state<ReturnType<typeof AIChatDialogue>>();
    let align = $state<'leftRight' | 'leftAlign'>('leftRight');
    let select = $state(true);
    let selection = $state<'allSelect' | 'cancelSelect'>('allSelect');

    onMount(() => dialogue?.selectAll());

    const onSelectionChange = (e: RadioChangeEvent) => {
        const value = e.target.value;
        if (value === 'allSelect') {
            dialogue?.selectAll();
            selection = value;
        } else if (value === 'cancelSelect') {
            dialogue?.deselectAll();
            selection = value;
        }
    };

    const onAlignChange = (e: RadioChangeEvent) => {
        const value = e.target.value;
        if (value === 'leftRight' || value === 'leftAlign') {
            align = value;
        }
    };

    const onSelectChange = (e: RadioChangeEvent) => {
        const value = e.target.value;
        if (typeof value === 'boolean') {
            select = value;
        }
    };

    const onSelect = (selectionId: string[]) => {
        console.log('onSelect', selectionId);
    };
</script>

<div>
    <span style="display: flex; flex-direction: column; row-gap: 8px">
        <span style="display: flex; align-items: center; column-gap: 10px">
            会话布局方式
            <RadioGroup onChange={onAlignChange} type="button" value={align}>
                <Radio value="leftRight">左右分布</Radio>
                <Radio value="leftAlign">左对齐</Radio>
            </RadioGroup>
        </span>
        <span style="display: flex; align-items: center; column-gap: 10px">
            是否开启选择
            <RadioGroup onChange={onSelectChange} type="button" value={select}>
                <Radio value={true}>开启</Radio>
                <Radio value={false}>关闭</Radio>
            </RadioGroup>
        </span>
        <span style="display: flex; align-items: center; column-gap: 10px">
            选择方式
            <RadioGroup onChange={onSelectionChange} type="button" value={selection}>
                <Radio value="allSelect">全选</Radio>
                <Radio value="cancelSelect">取消全选</Radio>
            </RadioGroup>
        </span>
    </span>

    <div style="border: 1px solid var(--semi-color-border); border-radius: 12px; margin-top: 10px; padding: 20px">
        <AIChatDialogue {align} bind:this={dialogue} chats={messages} mode="bubble" {onSelect} {roleConfig} selecting={select} />
    </div>
</div>
