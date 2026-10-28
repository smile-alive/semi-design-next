import React, { Fragment } from 'react';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import Divider from '@fibrae/semi-ui-react/divider/index';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';
import ChatBox from './chat-box';
import type { ChatBoxProps, CommonChatsProps } from './interface';

const { PREFIX_DIVIDER } = cssClasses;
const { ROLE } = strings;

interface ChatContentProps extends CommonChatsProps {
    toast: ChatBoxProps['toast'];
}

function ChatContent({ chats, onMessageBadFeedback, onMessageCopy, mode, onChatsChange, onMessageDelete, onMessageGoodFeedback, onMessageReset, roleConfig, chatBoxRenderConfig, align, customMarkDownComponents, renderDivider, markdownRenderProps, escapeHtml, toast }: ChatContentProps) {
    return (
        <>
            {chats.map((item, index) => {
                const isLast = index === chats.length - 1;
                return item.role === ROLE.DIVIDER ? (
                    renderDivider ? (
                        <Fragment key={item.id}>{renderDivider(item)}</Fragment>
                    ) : (
                        <Divider key={item.id} className={PREFIX_DIVIDER}>
                            <LocaleConsumer componentName="Chat">{(locale: Locale['Chat']) => locale['clearContext']}</LocaleConsumer>
                        </Divider>
                    )
                ) : (
                    <ChatBox
                        key={item.id}
                        align={align}
                        chatBoxRenderConfig={chatBoxRenderConfig}
                        customMarkDownComponents={customMarkDownComponents}
                        escapeHtml={escapeHtml}
                        isLast={isLast}
                        markdownRenderProps={markdownRenderProps}
                        message={item}
                        mode={mode}
                        previousMessage={index ? chats[index - 1] : undefined}
                        roleConfig={roleConfig}
                        toast={toast}
                        onChatsChange={onChatsChange}
                        onMessageBadFeedback={onMessageBadFeedback}
                        onMessageCopy={onMessageCopy}
                        onMessageDelete={onMessageDelete}
                        onMessageGoodFeedback={onMessageGoodFeedback}
                        onMessageReset={onMessageReset}
                    />
                );
            })}
        </>
    );
}

export default React.memo(ChatContent);
