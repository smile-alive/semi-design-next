import { type DragEvent, useCallback, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, isUnfinishedMessageStatus } from '@fibrae/semi-ai-foundation/chat/constants';
import ChatFoundation, { type ChatAdapter } from '@fibrae/semi-ai-foundation/chat/foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-ai-foundation/chat/chat.scss';
import { IconChevronDown, IconDisc } from '@fibrae/semi-icons-react';
import { namedRole } from '@fibrae/semi-ui-react/_base/named-role';
import useDefaultProps from '@fibrae/semi-ui-react/_base/use-default-props';
import useFoundation from '@fibrae/semi-ui-react/_base/use-foundation';
import Button from '@fibrae/semi-ui-react/button/index';
import { useDidUpdate, useLocale } from '@fibrae/semi-ui-react/hooks';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';
import ReactResizeObserver from '@fibrae/semi-ui-react/resize-observer/index';
import Toast from '@fibrae/semi-ui-react/toast/index';
import type { UploadHandle } from '@fibrae/semi-ui-react/upload/index';
import ChatContent from './chat-content';
import Hint from './hint';
import InputBox from './input-box';
import type { ChatProps, ChatState, InputBoxHandle } from './interface';

export type { ChatHandle } from './interface';

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

    const [foundation, state] = useFoundation<ChatFoundation, ChatAdapter<ChatProps, ChatState>, ChatProps, ChatState>(
        ChatFoundation,
        props,
        () => ({ backBottomVisible: false, uploadAreaVisible: false }),
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
            setBackBottomVisible: (visible) => {
                if (base.getState('backBottomVisible') !== visible) {
                    base.setState({ backBottomVisible: visible });
                }
            },
            notifyStopGenerate: (e) => base.getProps().onStopGenerator?.(e),
            notifyHintClick: (hint) => base.getProps().onHintClick?.(hint),
            setUploadAreaVisible: (visible) => base.setState({ uploadAreaVisible: visible }),
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
        if (dragUpload) {
            foundation.handleDragOver(e);
        }
        onDragOver?.(e);
    };

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        if (dragUpload) {
            foundation.handleDragStart();
        }
        onDragStart?.(e);
    };

    const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
        if (dragUpload) {
            foundation.handleDragEnd();
        }
        onDragEnd?.(e);
    };

    useDidUpdate(props.chats, foundation.handleChatsChange);
    useDidUpdate(props.hints, foundation.handleHintsChange);

    useImperativeHandle(
        props.ref,
        () => ({
            resetMessage: () => foundation.resetMessage(null),
            clearContext: () => foundation.clearContext(null),
            scrollToBottom: (animation) => {
                if (animation) {
                    foundation.scrollToBottomWithAnimation();
                } else {
                    foundation.scrollToBottomImmediately();
                }
            },
            sendMessage: foundation.onMessageSend,
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
                            {!!hints?.length && <Hint className={hintCls} style={hintStyle} value={hints} renderHintBox={renderHintBox} onHintClick={foundation.onHintClick} />}
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
                    onInputChange={foundation.onInputChange}
                    onSend={foundation.onMessageSend}
                />
                {bottomSlot}
            </div>
        </div>
    );
}
