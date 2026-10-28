import { For, type JSX, Show, createMemo, createSignal, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, isUnfinishedMessageStatus, strings } from '@fibrae/semi-ai-foundation/chat/constants';
import ChatFoundation, { type ChatAdapter } from '@fibrae/semi-ai-foundation/chat/foundation';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-ai-foundation/chat/chat.scss';
import { IconChevronDown, IconDisc } from '@fibrae/semi-icons-solid';
import callHandler from '@fibrae/semi-ui-solid/_base/call-handler';
import mergeRefs from '@fibrae/semi-ui-solid/_base/merge-refs';
import { namedRole } from '@fibrae/semi-ui-solid/_base/named-role';
import useDefaultProps from '@fibrae/semi-ui-solid/_base/use-default-props';
import useFoundation from '@fibrae/semi-ui-solid/_base/use-foundation';
import useWatch from '@fibrae/semi-ui-solid/_base/use-watch';
import Button from '@fibrae/semi-ui-solid/button/index';
import Divider from '@fibrae/semi-ui-solid/divider/index';
import { useLocale, useResizeObserver } from '@fibrae/semi-ui-solid/hooks';
import Toast from '@fibrae/semi-ui-solid/toast/index';
import ChatBox from './chat-box';
import { ChatContext, type ChatContextValue, type ChatView } from './context';
import Hint from './hint';
import InputBox, { type InputBoxHandle } from './input-box';
import type { ChatHandle, ChatProps, ChatState, Message } from './interface';

type Foundation = ChatFoundation<ChatProps, ChatState>;
type Adapter = ChatAdapter<ChatProps, ChatState>;

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
        'inputBoxCls',
        'inputBoxStyle',
        'hintStyle',
        'hintCls',
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

    const { foundation, state } = useFoundation<Foundation, Adapter, ChatProps, ChatState>(
        ChatFoundation,
        props,
        () => ({ backBottomVisible: false, uploadAreaVisible: false }),
        (base) => ({
            getContainerRef: () => container() as HTMLDivElement,
            notifyChatsChange: (chats) => local.onChatsChange?.(chats),
            notifyLikeMessage: (message) => local.onMessageGoodFeedback?.(message),
            notifyDislikeMessage: (message) => local.onMessageBadFeedback?.(message),
            notifyMessageDelete: (message) => local.onMessageDelete?.(message),
            // a reset from the handle has no message and reports null, as in React
            notifyMessageReset: (message) => local.onMessageReset?.(message),
            notifyClearContext: () => local.onClear?.(),
            notifyMessageSend: (content, attachment) => local.onMessageSend?.(content, attachment),
            notifyInputChange: (value) => local.onInputChange?.(value),
            setBackBottomVisible: (visible) => {
                if (base.getState('backBottomVisible') !== visible) {
                    base.setState({ backBottomVisible: visible });
                }
            },
            notifyStopGenerate: (e) => local.onStopGenerator?.(e),
            notifyHintClick: (hint) => local.onHintClick?.(hint),
            setUploadAreaVisible: (visible) => base.setState({ uploadAreaVisible: visible }),
            manualUpload: (files) => inputBox?.insert(files),
            getDropAreaElement: () => dropArea as HTMLDivElement,
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
        likeMessage: (message) => foundation.likeMessage(message),
        dislikeMessage: (message) => foundation.dislikeMessage(message),
        resetMessage: (message) => foundation.resetMessage(message),
        deleteMessage: (message) => foundation.deleteMessage(message),
        copyMessage: (message) => local.onMessageCopy?.(message),
    };

    const handle: ChatHandle = {
        resetMessage: () => foundation.resetMessage(null),
        clearContext: () => foundation.clearContext(null),
        scrollToBottom: (animation) => {
            if (animation) {
                foundation.scrollToBottomWithAnimation();
            } else {
                foundation.scrollToBottomImmediately();
            }
        },
        sendMessage: (content, attachment) => foundation.onMessageSend(content, attachment),
    };

    const handleDragOver = (e: RootDragEvent) => {
        if (upload().dragUpload) {
            foundation.handleDragOver(e);
        }
        callHandler(local.onDragOver, e);
    };

    const handleDragStart = (e: RootDragEvent) => {
        if (upload().dragUpload) {
            foundation.handleDragStart();
        }
        callHandler(local.onDragStart, e);
    };

    const handleDragEnd = (e: RootDragEvent) => {
        if (upload().dragUpload) {
            foundation.handleDragEnd();
        }
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
        const entry = createMemo<Row>((prev) => rows().get(key) ?? prev, untrack(() => rows().get(key)) as Row, { equals: sameFields });
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

    useWatch(
        () => local.chats,
        (chats, previous) => foundation.handleChatsChange(chats ?? emptyChats, previous ?? emptyChats)
    );

    useWatch(
        () => local.hints,
        (hints, previous) => foundation.handleHintsChange(hints ?? [], previous ?? [])
    );

    useResizeObserver(container, () => foundation.handleScrollContainerResize());

    return (
        <div
            {...rest}
            ref={(node) => mergeRefs(local.ref)(Object.assign(node, handle))}
            role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']}
            class={clsx(prefixCls, local.class)}
            style={local.style}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
        >
            <Show when={upload().dragUpload && state().uploadAreaVisible}>
                <div ref={(node) => (dropArea = node)} class={`${prefixCls}-dropArea`} onDragLeave={(e) => foundation.handleContainerDragLeave(e)} onDragOver={(e) => foundation.handleContainerDragOver(e)} onDrop={(e) => foundation.handleContainerDrop(e)}>
                    <span class={`${prefixCls}-dropArea-text`}>{locale().locale.dropAreaText}</span>
                </div>
            </Show>
            <div class={`${prefixCls}-inner`}>
                {local.topSlot}
                <div class={`${prefixCls}-content`}>
                    <div ref={setContainer} class={`${prefixCls}-container`} aria-busy={streaming()} aria-label={locale().locale.messages} role="log" tabIndex={-1} onScroll={(e) => foundation.containerScroll(e)}>
                        <ChatContext.Provider value={context}>
                            <For each={keys()}>{renderRow}</For>
                        </ChatContext.Provider>
                        <Show when={local.hints?.length}>
                            <Hint class={local.hintCls} style={local.hintStyle} value={local.hints ?? []} renderHintBox={local.renderHintBox} onHintClick={(hint) => foundation.onHintClick(hint)} />
                        </Show>
                    </div>
                    {/* outside the log: a toast inside it would be announced as one more log entry */}
                    <div class={`${prefixCls}-toast`}>{toastHolder}</div>
                </div>
                <Show when={state().backBottomVisible && !generating()}>
                    <span ref={handoverActionFocus} class={`${prefixCls}-action`}>
                        <Button type="tertiary" class={`${prefixCls}-action-content ${prefixCls}-action-backBottom`} aria-label={locale().locale.backToBottom} icon={<IconChevronDown size="extra-large" />} onClick={() => foundation.scrollToBottomWithAnimation()} />
                    </span>
                </Show>
                <Show when={generating()}>
                    <span ref={handoverActionFocus} class={`${prefixCls}-action`}>
                        <Button type="tertiary" class={`${prefixCls}-action-content ${prefixCls}-action-stop`} icon={<IconDisc size="extra-large" />} onClick={(e) => foundation.stopGenerate(e)}>
                            {locale().locale.stop}
                        </Button>
                    </span>
                </Show>
                <InputBox
                    ref={(handle) => (inputBox = handle)}
                    class={local.inputBoxCls}
                    style={local.inputBoxStyle}
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
                    onClearContext={(e) => foundation.clearContext(e)}
                    onInputChange={(value) => foundation.onInputChange(value)}
                    onSend={(content, attachment) => foundation.onMessageSend(content, attachment)}
                />
                {local.bottomSlot}
            </div>
        </div>
    );
}
