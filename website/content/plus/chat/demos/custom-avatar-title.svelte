<script lang="ts">
    import { Chat, type ChatAvatarSnippetProps, type ChatMessage, type ChatTitleSnippetProps } from '@fibrae/semi-ai-svelte';
    import { Avatar, Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-svelte';

    const roleInfo = {
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

    const commonOuterStyle = 'border: 1px solid var(--semi-color-border); border-radius: 16px; height: 400px';

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    function formatTime(createAt?: number) {
        const date = new Date(createAt ?? Date.now());
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        return `${hours}:${minutes}`;
    }

    let message = $state<ChatMessage[]>([
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
            content: [
                {
                    type: 'text',
                    text: '这张图片里有什么？',
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: '/assets/root-web-sites/edit-bag.jpeg',
                    },
                },
            ],
        },
        {
            role: 'assistant',
            id: '3',
            createAt: 1715676751919,
            content: '图片中是一个有卡通画像装饰的黄色背包。',
        },
    ]);
    let title = $state<RadioValue | undefined>('null');
    let avatar = $state<RadioValue | undefined>('null');

    const onMessageSend = () => {
        const newAssistantMessage: ChatMessage = {
            role: 'assistant',
            id: getId(),
            content: 'This is a mock response',
        };
        setTimeout(() => {
            message = [...message, newAssistantMessage];
        }, 200);
    };
</script>

{#snippet customAvatar(props: ChatAvatarSnippetProps)}
    <Avatar shape="square" size="extra-small" style="flex-shrink: 0">{props.role.name}</Avatar>
{/snippet}

{#snippet customTitle(props: ChatTitleSnippetProps)}
    <span class="title">
        {props.role.name}
        <span class="time">{formatTime(props.message.createAt)}</span>
    </span>
{/snippet}

<!-- a provided snippet that renders nothing hides the avatar or the title -->
{#snippet nothing()}{/snippet}

<span style="display: flex; flex-direction: column; row-gap: 8px; margin-bottom: 5px">
    <span style="display: flex; align-items: center; column-gap: 10px">
        头像渲染模式
        <RadioGroup aria-label="头像渲染模式" bind:value={avatar} type="button">
            <Radio value="default">默认头像</Radio>
            <Radio value="null">无头像</Radio>
            <Radio value="custom">自定义头像</Radio>
        </RadioGroup>
    </span>
    <span style="display: flex; align-items: center; column-gap: 10px">
        标题渲染模式
        <RadioGroup aria-label="标题渲染模式" bind:value={title} type="button">
            <Radio value="default">默认标题</Radio>
            <Radio value="null">无标题</Radio>
            <Radio value="custom">自定义标题</Radio>
        </RadioGroup>
    </span>
</span>
{#key `${avatar}${title}`}
    <Chat avatar={avatar === 'custom' ? customAvatar : avatar === 'null' ? nothing : undefined} bind:chats={message} class="component-chat-demo-custom-render" {onMessageSend} roleConfig={roleInfo} style={commonOuterStyle} title={title === 'custom' ? customTitle : title === 'null' ? nothing : undefined} {uploadProps} />
{/key}
