<script lang="ts">
    import { AIChatDialogue, type AIChatDialogueMessage as Message, type AIChatDialogueProps } from '@fibrae/semi-ai-svelte';
    import { Radio, RadioGroup, type RadioChangeEvent } from '@fibrae/semi-ui-svelte';

    type Mode = NonNullable<AIChatDialogueProps['mode']>;
    type Align = NonNullable<AIChatDialogueProps['align']>;

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

    let messages = $state<Message[]>([
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
    ]);
    let mode = $state<Mode>('bubble');
    let align = $state<Align>('leftRight');

    const onModeChange = (e: RadioChangeEvent) => {
        mode = e.target.value as Mode;
    };
    const onAlignChange = (e: RadioChangeEvent) => {
        align = e.target.value as Align;
    };
</script>

<span style="display: flex; flex-direction: column; row-gap: 8px">
    <span style="display: flex; align-items: center; column-gap: 10px">
        模式
        <RadioGroup aria-label="模式" onChange={onModeChange} type="button" value={mode}>
            <Radio value="bubble">气泡</Radio>
            <Radio value="noBubble">非气泡</Radio>
            <Radio value="userBubble">用户会话气泡</Radio>
        </RadioGroup>
    </span>
    <span style="display: flex; align-items: center; column-gap: 10px">
        会话布局方式
        <RadioGroup aria-label="会话布局方式" onChange={onAlignChange} type="button" value={align}>
            <Radio value="leftRight">左右分布</Radio>
            <Radio value="leftAlign">左对齐</Radio>
        </RadioGroup>
    </span>
</span>
<div style="border: 1px solid var(--semi-color-border); border-radius: 12px; margin-top: 10px; padding: 20px">
    <AIChatDialogue {align} bind:chats={messages} {mode} {roleConfig} />
</div>
