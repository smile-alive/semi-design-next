<script lang="ts">
    import { Chat, type ChatAlign, type ChatMessage, type ChatMode } from '@fibrae/semi-ai-svelte';
    import { Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-svelte';

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

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    let messages = $state<ChatMessage[]>([
        {
            role: 'system',
            id: '1',
            createAt: 1715676751919,
            content: "Hello, I'm your AI assistant.",
        },
        {
            role: 'user',
            id: '2',
            createAt: 1715676751919,
            content: '给一个 Semi Design 的 Button 组件的使用示例',
        },
        {
            role: 'assistant',
            id: '3',
            createAt: 1715676751919,
            content: '以下是一个 Semi 代码的使用示例：\n```svelte \n<Button>Click me</Button>\n```\n',
        },
    ]);
    let mode = $state<RadioValue | undefined>('bubble');
    let align = $state<RadioValue | undefined>('leftRight');

    const onMessageSend = () => {
        const newAssistantMessage: ChatMessage = {
            role: 'assistant',
            id: getId(),
            createAt: Date.now(),
            content: '这是一条 mock 回复信息',
        };
        setTimeout(() => {
            messages = [...messages, newAssistantMessage];
        }, 200);
    };

    const onMessageReset = () => {
        setTimeout(() => {
            const lastMessage = messages[messages.length - 1];
            const newLastMessage: ChatMessage = {
                ...lastMessage,
                status: 'complete',
                content: 'This is a mock reset message.',
            };
            messages = [...messages.slice(0, -1), newLastMessage];
        }, 200);
    };
</script>

<span style="display: flex; flex-direction: column; row-gap: 8px">
    <span style="display: flex; align-items: center; column-gap: 10px">
        模式
        <RadioGroup aria-label="模式" bind:value={mode} type="button">
            <Radio value="bubble">气泡</Radio>
            <Radio value="noBubble">非气泡</Radio>
            <Radio value="userBubble">用户会话气泡</Radio>
        </RadioGroup>
    </span>
    <span style="display: flex; align-items: center; column-gap: 10px">
        会话布局方式
        <RadioGroup aria-label="会话布局方式" bind:value={align} type="button">
            <Radio value="leftRight">左右分布</Radio>
            <Radio value="leftAlign">左对齐</Radio>
        </RadioGroup>
    </span>
</span>
{#key `${align}${mode}`}
    <Chat align={align as ChatAlign} bind:chats={messages} mode={mode as ChatMode} {onMessageReset} {onMessageSend} {roleConfig} style="border: 1px solid var(--semi-color-border); border-radius: 16px; margin: 8px 16px; height: 550px" {uploadProps}>
        {#snippet uploadTip()}自定义上传按钮提示信息{/snippet}
    </Chat>
{/key}
