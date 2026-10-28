import { Show, createMemo } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
import ChatBoxAction from './chat-box-action';
import ChatBoxAvatar from './chat-box-avatar';
import ChatBoxContent from './chat-box-content';
import ChatBoxTitle from './chat-box-title';
import { useChatContext } from './context';
import type { Message, Metadata } from './interface';

const { PREFIX_CHAT_BOX } = cssClasses;
const { ROLE, CHAT_ALIGN } = strings;

const noRole: Metadata = {};

interface ChatBoxProps {
    message: Message;
    continueSend: boolean;
    isLast: boolean;
}

export default function ChatBox(props: ChatBoxProps) {
    const chat = useChatContext('ChatBox');

    const role = createMemo(() => chat.view().roleConfig?.[props.message.role ?? ''] ?? noRole);

    const config = () => chat.view().chatBoxRenderConfig ?? {};

    const containerCls = () => clsx(PREFIX_CHAT_BOX, { [`${PREFIX_CHAT_BOX}-right`]: props.message.role === ROLE.USER && chat.view().align === CHAT_ALIGN.LEFT_RIGHT });

    const avatarNode = () => <ChatBoxAvatar role={role()} continueSend={props.continueSend} customRenderFunc={config().renderChatBoxAvatar} renderRoleAvatar={config().renderRoleAvatar} message={props.message} />;

    const titleNode = () => <ChatBoxTitle role={role()} customRenderFunc={config().renderChatBoxTitle} message={props.message} />;

    const contentNode = () => <ChatBoxContent role={role()} customMarkDownComponents={chat.view().customMarkDownComponents} customRenderFunc={config().renderChatBoxContent} escapeHtml={chat.view().escapeHtml} markdownRenderProps={chat.view().markdownRenderProps} message={props.message} mode={chat.view().mode} />;

    const actionNode = () => <ChatBoxAction customRenderFunc={config().renderChatBoxAction} isLast={props.isLast} message={props.message} />;

    return (
        <Show
            when={config().renderFullChatBox}
            keyed
            fallback={
                <div class={containerCls()}>
                    {avatarNode()}
                    <div class={`${PREFIX_CHAT_BOX}-wrap`}>
                        <Show when={!props.continueSend}>{titleNode()}</Show>
                        {contentNode()}
                        {actionNode()}
                    </div>
                </div>
            }
        >
            {(render) =>
                render({
                    get message() {
                        return props.message;
                    },
                    get role() {
                        return role();
                    },
                    // render functions: a node the renderer leaves out is never created, so it cannot shift the hydration keys
                    defaultNodes: { avatar: avatarNode, title: titleNode, content: contentNode, action: actionNode },
                    get class() {
                        return containerCls();
                    },
                })
            }
        </Show>
    );
}
