import React, { useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/components/chat/constants';
import type { ChatBoxProps } from '../interface';
import ChatBoxAction from './chat-box-action';
import ChatBoxAvatar from './chat-box-avatar';
import ChatBoxContent from './chat-box-content';
import ChatBoxTitle from './chat-box-title';

const { PREFIX_CHAT_BOX } = cssClasses;
const { ROLE, CHAT_ALIGN } = strings;

function ChatBox({ message, isLast, align, toast, mode, roleConfig, onMessageBadFeedback, onMessageGoodFeedback, onMessageCopy, onChatsChange, onMessageDelete, onMessageReset, chatBoxRenderConfig = {}, customMarkDownComponents, previousMessage, markdownRenderProps, escapeHtml, classNames, styles }: ChatBoxProps) {
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
        return <ChatBoxAvatar className={classNames?.itemAvatar} style={styles?.itemAvatar} role={info} continueSend={continueSend} customRenderFunc={renderChatBoxAvatar} message={message} />;
    }, [continueSend, info, message, renderChatBoxAvatar, classNames?.itemAvatar, styles?.itemAvatar]);

    const titleNode = useMemo(() => {
        return <ChatBoxTitle className={classNames?.itemTitle} style={styles?.itemTitle} role={info} customRenderFunc={renderChatBoxTitle} message={message} />;
    }, [info, message, renderChatBoxTitle, classNames?.itemTitle, styles?.itemTitle]);

    const contentNode = useMemo(() => {
        return <ChatBoxContent className={classNames?.itemContent} style={styles?.itemContent} role={info} customMarkDownComponents={customMarkDownComponents} customRenderFunc={renderChatBoxContent} escapeHtml={escapeHtml} markdownRenderProps={markdownRenderProps} message={message} mode={mode} />;
    }, [message, info, renderChatBoxContent, mode, escapeHtml, customMarkDownComponents, markdownRenderProps, classNames?.itemContent, styles?.itemContent]);

    const actionNode = useMemo(() => {
        return (
            <ChatBoxAction
                className={classNames?.itemActions}
                style={styles?.itemActions}
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
    }, [toast, message, info, isLast, onMessageBadFeedback, onMessageGoodFeedback, onMessageCopy, onChatsChange, onMessageDelete, onMessageReset, renderChatBoxAction, classNames?.itemActions, styles?.itemActions]);

    const containerCls = clsx(
        PREFIX_CHAT_BOX,
        {
            [`${PREFIX_CHAT_BOX}-right`]: message.role === ROLE.USER && align === CHAT_ALIGN.LEFT_RIGHT,
        },
        classNames?.item
    );

    if (typeof renderFullChatBox === 'function') {
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
        <div className={containerCls} style={styles?.item}>
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
