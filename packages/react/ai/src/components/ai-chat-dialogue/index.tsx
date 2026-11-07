import type React from 'react';
import { useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, isUnfinishedStatus } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
import DialogueFoundation, { type DialogueAdapter, type DialogueState, type Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
import '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/ai-chat-dialogue.scss';
import { IconChevronDown } from '@fibrae/semi-icons-react';
import useDefaultProps from '@fibrae/semi-ui-react/base/use-default-props';
import useFoundation from '@fibrae/semi-ui-react/base/use-foundation';
import Button from '@fibrae/semi-ui-react/button/index';
import { useFocusHandover, useLocale } from '@fibrae/semi-ui-react/hooks';
import { namedRole } from '@fibrae/semi-ui-react/utils/named-role';
import type { AIChatDialogueHandle, AIChatDialogueProps } from './interface';
import { AnnotationWidget } from './widgets/content-item/annotation';
import Code from './widgets/content-item/code';
import { DialogueStepWidget } from './widgets/content-item/dialogue-step';
import { ReasoningWidget } from './widgets/content-item/reasoning';
import DialogueItem from './widgets/dialogue';
import Hint from './widgets/dialogue-hint';

type Foundation = DialogueFoundation;
type Adapter = DialogueAdapter<AIChatDialogueProps>;

export * from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
export * from './interface';

const prefix = cssClasses.PREFIX;

// stable fallbacks: a missing prop must not count as a change on every render
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

function AIChatDialogue(rawProps: AIChatDialogueProps & { ref?: React.Ref<AIChatDialogueHandle> }) {
    const props = useDefaultProps('AIChatDialogue', rawProps, defaultProps);

    const {
        ref,
        align,
        chats: chatsProp,
        className,
        disabledFileItemClick,
        escapeHtml,
        hintCls,
        hints: hintsProp,
        hintStyle,
        selecting,
        markdownRenderProps,
        messageEditRender,
        mode,
        onAnnotationClick,
        onChatsChange,
        onFileClick,
        onHintClick,
        onImageClick,
        onMessageBadFeedback,
        onMessageCopy,
        onMessageDelete,
        onMessageEdit,
        onMessageGoodFeedback,
        onMessageReset,
        onMessageShare,
        onReferenceClick,
        onSelect,
        dialogueRenderConfig,
        renderDialogueContentItem,
        renderHintBox,
        roleConfig,
        showReset,
        showReference,
        style,
        ...rest
    } = props;

    const { locale } = useLocale('AIChatDialogue');

    const containerRef = useRef<HTMLDivElement>(null);

    const [foundation, { selectedIds, backBottomVisible }] = useFoundation<Foundation, Adapter, AIChatDialogueProps, DialogueState>(
        DialogueFoundation,
        props,
        () => DialogueFoundation.getInitialState(),
        (base) => ({
            getContainerRef: () => containerRef.current,
            notifySelect: (ids: string[]) => base.getProps().onSelect?.(ids),
            notifyChatsChange: (chats: Message[]) => base.getProps().onChatsChange?.(chats),
            notifyLikeMessage: (message: Message) => base.getProps().onMessageGoodFeedback?.(message),
            notifyDislikeMessage: (message: Message) => base.getProps().onMessageBadFeedback?.(message),
            notifyEditMessage: (message: Message) => base.getProps().onMessageEdit?.(message),
            notifyMessageDelete: (message: Message) => base.getProps().onMessageDelete?.(message),
            notifyMessageReset: (message: Message) => base.getProps().onMessageReset?.(message),
            notifyHintClick: (hint: string) => base.getProps().onHintClick?.(hint),
        })
    );

    // the button unmounts once the list is at the bottom; focus moves to the list instead of falling to the body
    const handoverBackBottomFocus = useFocusHandover<HTMLSpanElement>(() => containerRef.current);

    const chats = chatsProp ?? EMPTY_CHATS;
    const hints = hintsProp ?? EMPTY_HINTS;

    // a busy log defers announcements, so a streamed reply is read once it settles, not chunk by chunk
    const streaming = isUnfinishedStatus(chats.at(-1)?.status);

    useImperativeHandle(
        ref,
        () => ({
            selectAll: foundation.handleSelectAll,
            deselectAll: foundation.handleDeselectAll,
            scrollToBottom: foundation.scrollToBottom,
            scrollToTop: foundation.scrollToTop,
        }),
        [foundation]
    );

    return (
        <div role={namedRole(rest)} {...rest} className={clsx(prefix, className)} style={style}>
            <div ref={containerRef} className={`${prefix}-list`} aria-busy={streaming} aria-label={locale.messages} role="log" tabIndex={-1} onScroll={foundation.containerScroll}>
                {chats.map((chat, index) => (
                    <DialogueItem
                        key={chat.id}
                        role={roleConfig[chat.role]}
                        align={align}
                        // not exposed: no use case for hiding the avatar and title of follow-up messages yet
                        continueSend={false}
                        dialogueRenderConfig={dialogueRenderConfig}
                        disabledFileItemClick={disabledFileItemClick}
                        escapeHtml={escapeHtml}
                        isLastChat={index === chats.length - 1}
                        isSelected={selectedIds.has(chat.id)}
                        markdownRenderProps={markdownRenderProps}
                        message={chat}
                        mode={mode}
                        selecting={selecting}
                        showReference={showReference}
                        showReset={showReset}
                        messageEditRender={messageEditRender}
                        renderDialogueContentItem={renderDialogueContentItem}
                        onAnnotationClick={onAnnotationClick}
                        onFileClick={onFileClick}
                        onImageClick={onImageClick}
                        onMessageBadFeedback={foundation.dislikeMessage}
                        onMessageCopy={onMessageCopy}
                        onMessageDelete={foundation.deleteMessage}
                        onMessageEdit={foundation.editMessage}
                        onMessageGoodFeedback={foundation.likeMessage}
                        onMessageReset={foundation.resetMessage}
                        onMessageShare={onMessageShare}
                        onReferenceClick={onReferenceClick}
                        onSelectChange={foundation.handleSelectOrRemove}
                    />
                ))}
                {hints.length > 0 && <Hint className={hintCls} style={hintStyle} hints={hints} selecting={selecting} renderHintBox={renderHintBox} onHintClick={foundation.onHintClick} />}
            </div>
            {backBottomVisible && (
                <span ref={handoverBackBottomFocus} className={`${prefix}-backBottom`}>
                    <Button type="tertiary" className={`${prefix}-backBottom-button`} aria-label={locale.backToBottom} icon={<IconChevronDown size="extra-large" />} onClick={foundation.scrollToBottomWithAnimation} />
                </span>
            )}
        </div>
    );
}

export default Object.assign(AIChatDialogue, {
    Reasoning: ReasoningWidget,
    Step: DialogueStepWidget,
    Annotation: AnnotationWidget,
    defaultComponents: { code: Code },
});
