import { For, Show, createMemo, createSignal, mergeProps, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { followChats, followHints } from '@fibrae/semi-ai-foundation/base';
import { cssClasses, isUnfinishedMessageStatus, strings } from '@fibrae/semi-ai-foundation/components/chat/constants';
import ChatFoundation, { type ChatAdapter, type ChatState } from '@fibrae/semi-ai-foundation/components/chat/foundation';
import { FocusTrapHandle } from '@fibrae/semi-foundation/base';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-ai-foundation/components/chat/chat.scss';
import { IconChevronDown, IconDisc } from '@fibrae/semi-icons-solid';
import { useDefaultProps, useFoundation } from '@fibrae/semi-ui-solid/base';
import Button from '@fibrae/semi-ui-solid/button/index';
import Divider from '@fibrae/semi-ui-solid/divider/index';
import { useLocale, useResizeObserver } from '@fibrae/semi-ui-solid/primitives';
import Toast from '@fibrae/semi-ui-solid/toast/index';
import { callHandler, mergeRefs } from '@fibrae/semi-ui-solid/utils';
import ChatBox from './chat-box/chat-box';
import { ChatContext, type ChatContextValue, type ChatView } from './context';
import Hint from './hint';
import InputBox, { type InputBoxHandle } from './input-box';
import type { ChatHandle, ChatProps, Message } from './interface';

type Foundation = ChatFoundation<ChatProps>;
type Adapter = ChatAdapter<ChatProps>;

type RootDragEvent = DragEvent & { currentTarget: HTMLDivElement; target: Element };

interface Row {
    message: Message;
    index: number;
}

const prefixCls = cssClasses.PREFIX;
const { PREFIX_DIVIDER } = cssClasses;
const { ROLE } = strings;
const emptyChats: Message[] = [];

const defaultProps = {
    align: 'leftRight',
    showStopGenerate: false,
    mode: 'bubble',
    showClearContext: false,
    sendHotKey: 'enter',
    escapeHtml: true,
} satisfies Partial<ChatProps>;

// a consumer spreading a signal object notifies every prop on any change; memos built of props compare their fields
const sameFields = <T extends object>(a: T, b: T) => (Object.keys(a) as (keyof T)[]).every((key) => Object.is(a[key], b[key]));

// a message without an id, or repeating an earlier id, keeps its place by position
const keyOf = (message: Message, index: number, taken: Map<string, Row>) => (message.id !== undefined && !taken.has(message.id) ? message.id : `\0${index}`);

export default function Chat(rawProps: ChatProps) {
    const props = useDefaultProps('Chat', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'ref',
        'class',
        'style',
        'topSlot',
        'bottomSlot',
        'roleConfig',
        'hints',
        'chats',
        'onChatsChange',
        'onMessageCopy',
        'onMessageDelete',
        'onMessageBadFeedback',
        'onMessageGoodFeedback',
        'onMessageReset',
        'onMessageSend',
        'onStopGenerator',
        'onHintClick',
        'onClear',
        'onInputChange',
        'renderInputArea',
        'chatBoxRenderConfig',
        'align',
        'renderHintBox',
        'showStopGenerate',
        'customMarkDownComponents',
        'mode',
        'showClearContext',
        'placeholder',
        'classNames',
        'styles',
        'uploadProps',
        'uploadTipProps',
        'sendHotKey',
        'renderDivider',
        'markdownRenderProps',
        'enableUpload',
        'canSend',
        'escapeHtml',
        'onDragOver',
        'onDragStart',
        'onDragEnd',
    ]);

    const locale = useLocale('Chat');

    const [container, setContainer] = createSignal<HTMLDivElement>();
    let dropArea: HTMLDivElement | undefined;
    let inputBox: InputBoxHandle | undefined;

    const [toast, toastHolder] = Toast.useToast();

    const followedChats = createMemo(() => followChats(local.chats));
    const followedHints = createMemo(() => followHints(local.hints));

    const foundationProps = mergeProps(props, {
        get chats() {
            return followedChats();
        },
        get hints() {
            return followedHints();
        },
    });

    const { foundation, state } = useFoundation<Foundation, Adapter, ChatProps, ChatState>(
        ChatFoundation,
        foundationProps,
        () => ChatFoundation.getInitialState(),
        () => ({
            getContainerRef: () => container()!,
            notifyChatsChange: (chats) => local.onChatsChange?.(chats),
            notifyLikeMessage: (message) => local.onMessageGoodFeedback?.(message),
            notifyDislikeMessage: (message) => local.onMessageBadFeedback?.(message),
            notifyMessageDelete: (message) => local.onMessageDelete?.(message),
            // a reset from the handle has no message and reports null, as in React
            notifyMessageReset: (message) => local.onMessageReset?.(message),
            notifyClearContext: () => local.onClear?.(),
            notifyMessageSend: (content, attachment) => local.onMessageSend?.(content, attachment),
            notifyInputChange: (value) => local.onInputChange?.(value),
            notifyStopGenerate: (e) => local.onStopGenerator?.(e),
            notifyHintClick: (hint) => local.onHintClick?.(hint),
            manualUpload: (files) => inputBox?.insert(files),
            getDropAreaElement: () => dropArea!,
        })
    );

    const chats = createMemo(() => local.chats ?? emptyChats);

    // a busy log defers announcements, so a streamed reply is read once it settles
    const streaming = createMemo(() => isUnfinishedMessageStatus(chats().at(-1)?.status));
    const generating = createMemo(() => Boolean(local.showStopGenerate) && streaming());
    const upload = createMemo(() => ChatFoundation.getUploadProps(local.enableUpload, local.uploadProps?.disabled), undefined, { equals: sameFields });

    // Rows follow the message id, so a streamed chunk, which replaces the message object, keeps its row and DOM
    const rows = createMemo(() => chats().reduce((map, message, index) => map.set(keyOf(message, index, map), { message, index }), new Map<string, Row>()));
    const keys = createMemo(() => [...rows().keys()]);

    const view = createMemo(
        (): ChatView => ({
            align: local.align,
            chatBoxRenderConfig: local.chatBoxRenderConfig,
            customMarkDownComponents: local.customMarkDownComponents,
            escapeHtml: local.escapeHtml,
            markdownRenderProps: local.markdownRenderProps,
            mode: local.mode,
            renderDivider: local.renderDivider,
            roleConfig: local.roleConfig,
        }),
        undefined,
        { equals: sameFields }
    );

    const context: ChatContextValue = {
        view,
        toast,
        container,
        likeMessage: foundation.likeMessage,
        dislikeMessage: foundation.dislikeMessage,
        resetMessage: foundation.resetMessage,
        deleteMessage: foundation.deleteMessage,
        copyMessage: (message) => local.onMessageCopy?.(message),
    };

    const handle: ChatHandle = {
        resetMessage: () => foundation.resetMessage(null),
        clearContext: foundation.clearContext,
        scrollToBottom: foundation.scrollToBottom,
        sendMessage: foundation.sendMessage,
    };

    const handleDragOver = (e: RootDragEvent) => {
        foundation.handleDragOver(e);
        callHandler(local.onDragOver, e);
    };

    const handleDragStart = (e: RootDragEvent) => {
        foundation.handleDragStart();
        callHandler(local.onDragStart, e);
    };

    const handleDragEnd = (e: RootDragEvent) => {
        foundation.handleDragEnd();
        callHandler(local.onDragEnd, e);
    };

    // The stop and back-to-bottom buttons go away on their own; focus moves to the input instead of falling to the body.
    // Cleanup runs while the node is still in the document and holds the focus.
    const handoverActionFocus = (node: HTMLSpanElement) => {
        onCleanup(() => {
            if (node.contains(FocusTrapHandle.getActiveElement(node))) {
                inputBox?.focus();
            }
        });
    };

    const renderRow = (key: string) => {
        // a row keeps its last entry while the list it left is still being removed
        const entry = createMemo<Row>(
            (prev) => rows().get(key) ?? prev,
            untrack(() => rows().get(key))!,
            { equals: sameFields }
        );
        const message = () => entry().message;
        const isLast = () => entry().index === chats().length - 1;
        // the first message has no predecessor, even when its role is undefined too
        const continueSend = () => {
            const previous = chats()[entry().index - 1];
            return previous !== undefined && previous.role === message().role;
        };
        return (
            <Show when={message().role === ROLE.DIVIDER} fallback={<ChatBox message={message()} continueSend={continueSend()} isLast={isLast()} />}>
                <Show when={view().renderDivider} keyed fallback={<Divider class={PREFIX_DIVIDER}>{locale().locale.clearContext}</Divider>}>
                    {(render) => render(message())}
                </Show>
            </Show>
        );
    };

    useResizeObserver(container, foundation.handleScrollContainerResize);

    return (
        <div {...rest} ref={(node) => mergeRefs(local.ref)(Object.assign(node, handle))} role={namedRole(rest)} class={clsx(prefixCls, local.class)} style={local.style} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDragStart={handleDragStart}>
            <Show when={upload().dragUpload && state().uploadAreaVisible}>
                <div ref={(node) => (dropArea = node)} class={`${prefixCls}-dropArea`} onDragLeave={foundation.handleContainerDragLeave} onDragOver={foundation.handleContainerDragOver} onDrop={foundation.handleContainerDrop}>
                    <span class={`${prefixCls}-dropArea-text`}>{locale().locale.dropAreaText}</span>
                </div>
            </Show>
            <div class={`${prefixCls}-inner`}>
                {local.topSlot}
                <div class={`${prefixCls}-content`}>
                    <div ref={setContainer} class={`${prefixCls}-container`} aria-busy={streaming()} aria-label={locale().locale.messages} role="log" tabIndex={-1} onScroll={foundation.containerScroll}>
                        <ChatContext.Provider value={context}>
                            <For each={keys()}>{renderRow}</For>
                        </ChatContext.Provider>
                        <Show when={local.hints?.length}>
                            <Hint class={local.classNames?.hint} style={local.styles?.hint} value={local.hints ?? []} renderHintBox={local.renderHintBox} onHintClick={foundation.handleHintClick} />
                        </Show>
                    </div>
                    {/* outside the log: a toast inside it would be announced as one more log entry */}
                    <div class={`${prefixCls}-toast`}>{toastHolder}</div>
                </div>
                <Show when={state().backBottomVisible && !generating()}>
                    <span ref={handoverActionFocus} class={`${prefixCls}-action`}>
                        <Button type="tertiary" class={`${prefixCls}-action-content ${prefixCls}-action-backBottom`} aria-label={locale().locale.backToBottom} icon={<IconChevronDown size="extra-large" />} onClick={foundation.scrollToBottomWithAnimation} />
                    </span>
                </Show>
                <Show when={generating()}>
                    <span ref={handoverActionFocus} class={`${prefixCls}-action`}>
                        <Button type="tertiary" class={`${prefixCls}-action-content ${prefixCls}-action-stop`} icon={<IconDisc size="extra-large" />} onClick={foundation.stopGenerate}>
                            {locale().locale.stop}
                        </Button>
                    </span>
                </Show>
                <InputBox
                    ref={(handle) => (inputBox = handle)}
                    class={local.classNames?.inputBox}
                    style={local.styles?.inputBox}
                    placeholder={local.placeholder}
                    canSend={local.canSend}
                    clickUpload={upload().clickUpload}
                    disableSend={generating()}
                    dragUpload={upload().dragUpload}
                    pasteUpload={upload().pasteUpload}
                    sendHotKey={local.sendHotKey}
                    showClearContext={local.showClearContext}
                    uploadProps={local.uploadProps}
                    uploadTipProps={local.uploadTipProps}
                    renderInputArea={local.renderInputArea}
                    onClearContext={foundation.clearContext}
                    onInputChange={foundation.handleInputChange}
                    onSend={foundation.sendMessage}
                />
                {local.bottomSlot}
            </div>
        </div>
    );
}
