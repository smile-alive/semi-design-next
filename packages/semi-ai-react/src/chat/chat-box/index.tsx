import React, { useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
import type { ChatBoxProps } from '../interface';
import ChatBoxAction from './chat-box-action';
import ChatBoxAvatar from './chat-box-avatar';
import ChatBoxContent from './chat-box-content';
import ChatBoxTitle from './chat-box-title';

const { PREFIX_CHAT_BOX } = cssClasses;
const { ROLE, CHAT_ALIGN } = strings;

function ChatBox({ message, isLast, align, toast, mode, roleConfig, onMessageBadFeedback, onMessageGoodFeedback, onMessageCopy, onChatsChange, onMessageDelete, onMessageReset, chatBoxRenderConfig = {}, customMarkDownComponents, previousMessage, markdownRenderProps, escapeHtml }: ChatBoxProps) {
    const { renderChatBoxAvatar, renderChatBoxAction, renderChatBoxContent, renderChatBoxTitle, renderFullChatBox } = chatBoxRenderConfig;

    // the first message has no predecessor, even when its role is undefined too
    const continueSend = previousMessage !== undefined && message.role === previousMessage.role;

    const info = useMemo(() => {
        let info = {};
        if (roleConfig) {
            info = roleConfig[message.role] ?? {};
        }
        return info;
    }, [message.role, roleConfig]);

    const avatarNode = useMemo(() => {
        return <ChatBoxAvatar role={info} continueSend={continueSend} customRenderFunc={renderChatBoxAvatar} message={message} />;
    }, [continueSend, info, message, renderChatBoxAvatar]);

    const titleNode = useMemo(() => {
        return <ChatBoxTitle role={info} customRenderFunc={renderChatBoxTitle} message={message} />;
    }, [info, message, renderChatBoxTitle]);

    const contentNode = useMemo(() => {
        return <ChatBoxContent role={info} customMarkDownComponents={customMarkDownComponents} customRenderFunc={renderChatBoxContent} escapeHtml={escapeHtml} markdownRenderProps={markdownRenderProps} message={message} mode={mode} />;
    }, [message, info, renderChatBoxContent, mode, escapeHtml, customMarkDownComponents, markdownRenderProps]);

    const actionNode = useMemo(() => {
        return (
            <ChatBoxAction
                role={info}
                customRenderFunc={renderChatBoxAction}
                isLast={isLast}
                message={message}
                toast={toast}
                onChatsChange={onChatsChange}
                onMessageBadFeedback={onMessageBadFeedback}
                onMessageCopy={onMessageCopy}
                onMessageDelete={onMessageDelete}
                onMessageGoodFeedback={onMessageGoodFeedback}
                onMessageReset={onMessageReset}
            />
        );
    }, [toast, message, info, isLast, onMessageBadFeedback, onMessageGoodFeedback, onMessageCopy, onChatsChange, onMessageDelete, onMessageReset, renderChatBoxAction]);

    const containerCls = clsx(PREFIX_CHAT_BOX, {
        [`${PREFIX_CHAT_BOX}-right`]: message.role === ROLE.USER && align === CHAT_ALIGN.LEFT_RIGHT,
    });

    if (renderFullChatBox && typeof renderFullChatBox === 'function') {
        return renderFullChatBox({
            message,
            role: info,
            defaultNodes: {
                avatar: avatarNode,
                title: titleNode,
                content: contentNode,
                action: actionNode,
            },
            className: containerCls,
        });
    }

    return (
        <div className={containerCls}>
            {avatarNode}
            <div className={`${PREFIX_CHAT_BOX}-wrap`}>
                {!continueSend && titleNode}
                {contentNode}
                {actionNode}
            </div>
        </div>
    );
}

export default React.memo(ChatBox);
