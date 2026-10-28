import { For, createSignal } from 'solid-js';
import { Chat, type ChatMessage as Message, type ChatRenderActionProps as RenderActionProps } from '@fibrae/semi-ai-solid';
import { IconForward, IconMoreStroked } from '@fibrae/semi-icons-solid';
import { Button, Dropdown, DropdownItem, DropdownMenu } from '@fibrae/semi-ui-solid';

const defaultMessage: Message[] = [
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
        content: '介绍一下 semi design',
    },
    {
        role: 'assistant',
        id: '3',
        createAt: 1715676751919,
        content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统',
    },
];

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

const commonOuterStyle = {
    border: '1px solid var(--semi-color-border)',
    'border-radius': '16px',
    height: '400px',
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

const renderChatBoxAction = (props: RenderActionProps) => (
    <span class={props.class}>
        <For each={props.defaultActions}>{(action) => action()}</For>

        <Dropdown
            render={
                <DropdownMenu>
                    <DropdownItem icon={<IconForward />}>分享</DropdownItem>
                </DropdownMenu>
            }
            trigger="click"
            position="top"
        >
            {(trigger) => <Button {...trigger()} class="semi-chat-chatBox-action-btn" aria-label="更多" icon={<IconMoreStroked />} theme="borderless" type="tertiary" />}
        </Dropdown>
    </span>
);

export default function ChatDemo() {
    const [chats, setChats] = createSignal<Message[]>(defaultMessage);

    const onMessageSend = () => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            content: `This is a mock response`,
        };
        setTimeout(() => {
            setChats((list) => [...list, newAssistantMessage]);
        }, 200);
    };

    return <Chat chatBoxRenderConfig={{ renderChatBoxAction }} style={commonOuterStyle} chats={chats()} onChatsChange={(next) => setChats(next)} onMessageSend={onMessageSend} roleConfig={roleInfo} uploadProps={uploadProps} />;
}
