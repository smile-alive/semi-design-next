import { For, Show, createMemo, mergeProps, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { followChats, followHints } from '@fibrae/semi-ai-foundation/base';
import { cssClasses, isUnfinishedStatus } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
import DialogueFoundation, { type DialogueAdapter, type DialogueState, type Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
import { namedRole, shallowEqualObjects } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/ai-chat-dialogue.scss';
import { IconChevronDown } from '@fibrae/semi-icons-solid';
import { useDefaultProps, useFoundation } from '@fibrae/semi-ui-solid/base';
import Button from '@fibrae/semi-ui-solid/button/index';
import { useFocusHandover, useLocale } from '@fibrae/semi-ui-solid/primitives';
import { mergeRefs } from '@fibrae/semi-ui-solid/utils';
import { AIChatDialogueContext, type AIChatDialogueContextValue } from './context';
import Dialogue from './dialogue/dialogue';
import Hint from './dialogue/dialogue-hint';
import type { AIChatDialogueHandle, AIChatDialogueProps } from './interface';

type Foundation = DialogueFoundation<AIChatDialogueProps>;
type Adapter = DialogueAdapter<AIChatDialogueProps>;

const prefix = cssClasses.PREFIX;

// stable fallbacks: a missing prop must not count as a change of the list
const EMPTY_CHATS: Message[] = [];
const EMPTY_HINTS: string[] = [];

const defaultProps = {
    align: 'leftRight',
    mode: 'bubble',
    selecting: false,
    disabledFileItemClick: false,
    showReset: true,
    showReference: false,
    escapeHtml: true,
} satisfies Partial<AIChatDialogueProps>;

export default function AIChatDialogue(rawProps: AIChatDialogueProps) {
    const props = useDefaultProps('AIChatDialogue', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'ref',
        'class',
        'style',
        'align',
        'chats',
        'disabledFileItemClick',
        'escapeHtml',
        'classNames',
        'hints',
        'styles',
        'selecting',
        'markdownRenderProps',
        'messageEditRender',
        'mode',
        'onAnnotationClick',
        'onChatsChange',
        'onFileClick',
        'onHintClick',
        'onImageClick',
        'onMessageBadFeedback',
        'onMessageCopy',
        'onMessageDelete',
        'onMessageEdit',
        'onMessageGoodFeedback',
        'onMessageReset',
        'onMessageShare',
        'onReferenceClick',
        'onSelect',
        'dialogueRenderConfig',
        'renderDialogueContentItem',
        'renderHintBox',
        'roleConfig',
        'showReset',
        'showReference',
    ]);

    const locale = useLocale('AIChatDialogue');

    let list: HTMLDivElement | undefined;

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

    const { foundation, state } = useFoundation<Foundation, Adapter, AIChatDialogueProps, DialogueState>(
        DialogueFoundation,
        foundationProps,
        () => DialogueFoundation.getInitialState(),
        () => ({
            getContainerRef: () => list!,
            notifySelect: (ids) => local.onSelect?.(ids),
            notifyChatsChange: (chats) => local.onChatsChange?.(chats),
            notifyChatsPropChange: () => local.onChatsChange?.(local.chats ?? EMPTY_CHATS),
            notifyLikeMessage: (message) => local.onMessageGoodFeedback?.(message),
            notifyDislikeMessage: (message) => local.onMessageBadFeedback?.(message),
            notifyEditMessage: (message) => local.onMessageEdit?.(message),
            notifyMessageDelete: (message) => local.onMessageDelete?.(message),
            notifyMessageReset: (message) => local.onMessageReset?.(message),
            notifyHintClick: (hint) => local.onHintClick?.(hint),
        })
    );

    // the button unmounts once the list is at the bottom; focus moves to the list instead of falling to the body
    const handoverBackBottomFocus = useFocusHandover<HTMLSpanElement>(() => list);

    const chats = createMemo(() => local.chats ?? EMPTY_CHATS);
    const hints = createMemo(() => local.hints ?? EMPTY_HINTS);

    // Rows follow the message id, as React's key does: a streamed reply arrives as a new object with the same id per
    // chunk, and a row keyed by the object would rebuild its DOM and drop the focus inside it
    const chatIds = createMemo(() => chats().map((chat) => chat.id), undefined, { equals: isEqual });
    const chatsById = createMemo(() => new Map(chats().map((chat) => [chat.id, chat])));

    // compared by entry: a consumer spreading a signal object notifies every prop on any change
    const view = createMemo(
        () => ({
            align: local.align,
            dialogueRenderConfig: local.dialogueRenderConfig,
            disabledFileItemClick: local.disabledFileItemClick,
            escapeHtml: local.escapeHtml,
            markdownRenderProps: local.markdownRenderProps,
            messageEditRender: local.messageEditRender,
            mode: local.mode,
            renderDialogueContentItem: local.renderDialogueContentItem,
            selecting: local.selecting,
            showReference: local.showReference,
            showReset: local.showReset,
        }),
        undefined,
        { equals: shallowEqualObjects }
    );

    const handle: AIChatDialogueHandle = {
        selectAll: foundation.handleSelectAll,
        deselectAll: foundation.handleDeselectAll,
        scrollToBottom: foundation.scrollToBottom,
        scrollToTop: foundation.scrollToTop,
    };

    const context: AIChatDialogueContextValue = {
        view,
        selectChange: foundation.handleSelectOrRemove,
        annotationClick: (annotations) => local.onAnnotationClick?.(annotations),
        fileClick: (file) => local.onFileClick?.(file),
        imageClick: (image) => local.onImageClick?.(image),
        referenceClick: (item) => local.onReferenceClick?.(item),
        messageCopy: (message) => local.onMessageCopy?.(message),
        messageShare: (message) => local.onMessageShare?.(message),
        messageGoodFeedback: foundation.likeMessage,
        messageBadFeedback: foundation.dislikeMessage,
        messageReset: foundation.resetMessage,
        messageEdit: foundation.editMessage,
        messageDelete: foundation.deleteMessage,
    };

    // a busy log defers announcements, so a streamed reply is read once it settles, not chunk by chunk
    const streaming = () => isUnfinishedStatus(chats().at(-1)?.status);

    return (
        <div {...rest} ref={(node) => mergeRefs(local.ref)(Object.assign(node, handle))} role={namedRole(rest)} class={clsx(prefix, local.class)} style={local.style}>
            <div ref={(node) => (list = node)} class={`${prefix}-list`} aria-busy={streaming()} aria-label={locale().locale.messages} role="log" tabIndex={-1} onScroll={foundation.containerScroll}>
                <AIChatDialogueContext.Provider value={context}>
                    <For each={chatIds()}>
                        {(id, index) => {
                            // a row keeps its last message while the list it left is still being removed
                            const message = createMemo<Message>(
                                (previous) => chatsById().get(id) ?? previous,
                                untrack(() => chatsById().get(id))!
                            );
                            return <Dialogue role={local.roleConfig[message().role]} isLastChat={index() === chatIds().length - 1} isSelected={state().selectedIds.has(id)} message={message()} />;
                        }}
                    </For>
                    <Show when={hints().length > 0}>
                        <Hint class={local.classNames?.hint} style={local.styles?.hint} hints={hints()} selecting={local.selecting} renderHintBox={local.renderHintBox} onHintClick={foundation.handleHintClick} />
                    </Show>
                </AIChatDialogueContext.Provider>
            </div>
            <Show when={state().backBottomVisible}>
                <span ref={handoverBackBottomFocus} class={`${prefix}-backBottom`}>
                    <Button type="tertiary" class={`${prefix}-backBottom-button`} aria-label={locale().locale.backToBottom} icon={<IconChevronDown size="extra-large" />} onClick={foundation.scrollToBottomWithAnimation} />
                </span>
            </Show>
        </div>
    );
}
