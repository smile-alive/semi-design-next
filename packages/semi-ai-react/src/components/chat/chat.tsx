import { type DragEvent, useCallback, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, isUnfinishedMessageStatus } from '@fibrae/semi-ai-foundation/components/chat/constants';
import ChatFoundation, { type ChatAdapter, type ChatState } from '@fibrae/semi-ai-foundation/components/chat/foundation';
import FocusTrapHandle from '@fibrae/semi-foundation/base/focus-handle';
import type { Locale } from '@fibrae/semi-foundation/locale/index';
import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-ai-foundation/components/chat/chat.scss';
import { IconChevronDown, IconDisc } from '@fibrae/semi-icons-react';
import useDefaultProps from '@fibrae/semi-ui-react/base/use-default-props';
import useFoundation from '@fibrae/semi-ui-react/base/use-foundation';
import Button from '@fibrae/semi-ui-react/button/index';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import ReactResizeObserver from '@fibrae/semi-ui-react/internal/resize-observer/index';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';
import Toast from '@fibrae/semi-ui-react/toast/index';
import type { UploadHandle } from '@fibrae/semi-ui-react/upload/index';
import ChatContent from './chat-content';
import Hint from './hint';
import InputBox from './input-box';
import type { ChatProps, InputBoxHandle } from './interface';

type Foundation = ChatFoundation;
type Adapter = ChatAdapter<ChatProps>;

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    align: 'leftRight',
    showStopGenerate: false,
    mode: 'bubble',
    showClearContext: false,
    sendHotKey: 'enter',
    escapeHtml: true,
} satisfies Partial<ChatProps>;

export default function Chat(rawProps: ChatProps) {
    const props = useDefaultProps('Chat', rawProps, defaultProps);

    const {
        ref,
        topSlot,
        bottomSlot,
        roleConfig,
        hints,
        chats: rawChats,
        onChatsChange,
        onMessageCopy,
        onMessageDelete,
        onMessageBadFeedback,
        onMessageGoodFeedback,
        onMessageReset,
        onMessageSend,
        onStopGenerator,
        onHintClick,
        onClear,
        onInputChange,
        renderInputArea,
        chatBoxRenderConfig,
        align,
        renderHintBox,
        style,
        className,
        showStopGenerate,
        customMarkDownComponents,
        mode,
        showClearContext,
        placeholder,
        inputBoxCls,
        inputBoxStyle,
        hintStyle,
        hintCls,
        uploadProps,
        uploadTipProps,
        sendHotKey,
        renderDivider,
        markdownRenderProps,
        enableUpload,
        canSend,
        escapeHtml,
        onDragOver,
        onDragStart,
        onDragEnd,
        ...rest
    } = props;

    const { locale } = useLocale('Chat');

    const containerRef = useRef<HTMLDivElement>(null);
    const uploadRef = useRef<UploadHandle>(null);
    const dropAreaRef = useRef<HTMLDivElement>(null);
    const inputBox = useRef<InputBoxHandle>(null);

    const [toast, toastHolder] = Toast.useToast();

    const [foundation, state] = useFoundation<Foundation, Adapter, ChatProps, ChatState>(
        ChatFoundation,
        props,
        () => ChatFoundation.getInitialState(),
        (base) => ({
            getContainerRef: () => containerRef.current,
            notifyChatsChange: (chats) => base.getProps().onChatsChange?.(chats),
            notifyLikeMessage: (message) => base.getProps().onMessageGoodFeedback?.(message),
            notifyDislikeMessage: (message) => base.getProps().onMessageBadFeedback?.(message),
            notifyMessageDelete: (message) => base.getProps().onMessageDelete?.(message),
            notifyMessageReset: (message) => base.getProps().onMessageReset?.(message),
            notifyClearContext: () => base.getProps().onClear?.(),
            notifyMessageSend: (content, attachment) => base.getProps().onMessageSend?.(content, attachment),
            notifyInputChange: (value) => base.getProps().onInputChange?.(value),
            notifyStopGenerate: (e) => base.getProps().onStopGenerator?.(e),
            notifyHintClick: (hint) => base.getProps().onHintClick?.(hint),
            manualUpload: (files) => uploadRef.current?.insert(files),
            getDropAreaElement: () => dropAreaRef.current,
        })
    );

    const { backBottomVisible, uploadAreaVisible } = state;
    const chats = rawChats ?? [];
    const lastChat = chats.at(-1);

    // a busy log defers announcements, so a streamed reply is read once it settles
    const streaming = isUnfinishedMessageStatus(lastChat?.status);
    const generating = Boolean(showStopGenerate) && streaming;
    const { dragUpload, clickUpload, pasteUpload } = ChatFoundation.getUploadProps(enableUpload, uploadProps?.disabled);

    // The stop and back-to-bottom buttons go away on their own; focus moves to the input instead of falling to the body.
    // A ref cleanup runs while the node still holds focus; the callback is stable so re-renders do not run it.
    const handoverActionFocus = useCallback((node: HTMLSpanElement) => {
        return () => {
            if (node.contains(FocusTrapHandle.getActiveElement(node))) {
                inputBox.current?.focus();
            }
        };
    }, []);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        foundation.handleDragOver(e);
        onDragOver?.(e);
    };

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        foundation.handleDragStart();
        onDragStart?.(e);
    };

    const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
        foundation.handleDragEnd();
        onDragEnd?.(e);
    };

    useImperativeHandle(
        props.ref,
        () => ({
            resetMessage: () => foundation.resetMessage(null),
            clearContext: foundation.clearContext,
            scrollToBottom: foundation.scrollToBottom,
            sendMessage: foundation.sendMessage,
        }),
        [foundation]
    );

    return (
        <div role={namedRole(rest)} {...rest} className={clsx(prefixCls, className)} style={style} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDragStart={handleDragStart}>
            {dragUpload && uploadAreaVisible && (
                <div ref={dropAreaRef} className={`${prefixCls}-dropArea`} onDragLeave={foundation.handleContainerDragLeave} onDragOver={foundation.handleContainerDragOver} onDrop={foundation.handleContainerDrop}>
                    <span className={`${prefixCls}-dropArea-text`}>
                        <LocaleConsumer componentName="Chat">{(locale: Locale['Chat']) => locale['dropAreaText']}</LocaleConsumer>
                    </span>
                </div>
            )}
            <div className={`${prefixCls}-inner`}>
                {topSlot}
                <div className={`${prefixCls}-content`}>
                    <ReactResizeObserver onResize={foundation.handleScrollContainerResize}>
                        <div ref={containerRef} className={`${prefixCls}-container`} aria-busy={streaming} aria-label={locale.messages} role="log" tabIndex={-1} onScroll={foundation.containerScroll}>
                            <ChatContent
                                align={align}
                                chatBoxRenderConfig={chatBoxRenderConfig}
                                chats={chats}
                                customMarkDownComponents={customMarkDownComponents}
                                escapeHtml={escapeHtml}
                                markdownRenderProps={markdownRenderProps}
                                mode={mode}
                                roleConfig={roleConfig}
                                toast={toast}
                                renderDivider={renderDivider}
                                onChatsChange={onChatsChange}
                                onMessageBadFeedback={foundation.dislikeMessage}
                                onMessageCopy={onMessageCopy}
                                onMessageDelete={foundation.deleteMessage}
                                onMessageGoodFeedback={foundation.likeMessage}
                                onMessageReset={foundation.resetMessage}
                            />
                            {!!hints?.length && <Hint className={hintCls} style={hintStyle} value={hints} renderHintBox={renderHintBox} onHintClick={foundation.handleHintClick} />}
                        </div>
                    </ReactResizeObserver>
                    {/* outside the log: a toast inside it would be announced as one more log entry */}
                    <div className={`${prefixCls}-toast`}>{toastHolder}</div>
                </div>
                {backBottomVisible && !generating && (
                    <span ref={handoverActionFocus} className={`${prefixCls}-action`}>
                        <Button type="tertiary" className={`${prefixCls}-action-content ${prefixCls}-action-backBottom`} aria-label={locale.backToBottom} icon={<IconChevronDown size="extra-large" />} onClick={foundation.scrollToBottomWithAnimation} />
                    </span>
                )}
                {generating && (
                    <span ref={handoverActionFocus} className={`${prefixCls}-action`}>
                        <Button type="tertiary" className={`${prefixCls}-action-content ${prefixCls}-action-stop`} icon={<IconDisc size="extra-large" />} onClick={foundation.stopGenerate}>
                            <LocaleConsumer componentName="Chat">{(locale: Locale['Chat']) => locale['stop']}</LocaleConsumer>
                        </Button>
                    </span>
                )}
                <InputBox
                    ref={inputBox}
                    className={inputBoxCls}
                    style={inputBoxStyle}
                    placeholder={placeholder}
                    canSend={canSend}
                    clickUpload={clickUpload}
                    disableSend={generating}
                    dragUpload={dragUpload}
                    pasteUpload={pasteUpload}
                    sendHotKey={sendHotKey}
                    showClearContext={showClearContext}
                    uploadProps={uploadProps}
                    uploadRef={uploadRef}
                    uploadTipProps={uploadTipProps}
                    renderInputArea={renderInputArea}
                    onClearContext={foundation.clearContext}
                    onInputChange={foundation.handleInputChange}
                    onSend={foundation.sendMessage}
                />
                {bottomSlot}
            </div>
        </div>
    );
}
