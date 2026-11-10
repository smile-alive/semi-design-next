<script lang="ts" module>
    import type { Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';

    // shared, so a dialogue without chats or hints keeps the same lists between renders
    const EMPTY_CHATS: Message[] = [];
    const EMPTY_HINTS: string[] = [];
</script>

<script lang="ts">
    import { followChats, followHints } from '@fibrae/semi-ai-foundation/base';
    import { cssClasses, isUnfinishedStatus } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
    import DialogueFoundation, { type DialogueAdapter, type DialogueBaseProps, type DialogueState } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
    import { namedRole, handoverFocus } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/ai-chat-dialogue.scss';
    import { IconChevronDown } from '@fibrae/semi-icons-svelte';
    import { useDefaultProps, useFoundation } from '@fibrae/semi-ui-svelte/base';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { setAIChatDialogueContext } from './context.js';
    import DialogueHint from './dialogue/dialogue-hint.svelte';
    import Dialogue from './dialogue/dialogue.svelte';
    import type { AIChatDialogueProps } from './interface.js';

    type Foundation = DialogueFoundation<DialogueBaseProps>;
    type Adapter = DialogueAdapter<DialogueBaseProps>;

    const defaults = useDefaultProps('AIChatDialogue');

    let {
        chats = $bindable(),
        align = defaults('align', 'leftRight'),
        disabledFileItemClick = defaults('disabledFileItemClick', false),
        escapeHtml = defaults('escapeHtml', true),
        hintCls = defaults('hintCls'),
        hints = defaults('hints'),
        hintStyle = defaults('hintStyle'),
        markdownRenderProps = defaults('markdownRenderProps'),
        mode = defaults('mode', 'bubble'),
        roleConfig,
        selecting = defaults('selecting', false),
        showReference = defaults('showReference', false),
        showReset = defaults('showReset', true),
        onChatsChange,
        onAnnotationClick,
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
        avatar,
        title,
        content,
        action,
        fullDialogue,
        contentItem,
        messageText,
        messageEdit,
        hintBox,
        ...rest
    }: AIChatDialogueProps = $props();

    const locale = useLocale('AIChatDialogue');

    let list: HTMLDivElement | undefined = $state();

    const followedChats = $derived(followChats(chats));
    const followedHints = $derived(followHints(hints));

    const { foundation, states } = useFoundation<Foundation, Adapter, DialogueBaseProps, DialogueState>(
        DialogueFoundation,
        {
            get chats() {
                return followedChats;
            },
            get hints() {
                return followedHints;
            },
        },
        () => DialogueFoundation.getInitialState(),
        () => ({
            getContainerRef: () => list as HTMLDivElement,
            notifySelect: (ids) => onSelect?.(ids),
            notifyChatsChange: (next) => {
                chats = next;
                onChatsChange?.(next);
            },
            notifyChatsPropChange: () => onChatsChange?.(currentChats),
            notifyLikeMessage: (message) => onMessageGoodFeedback?.(message),
            notifyDislikeMessage: (message) => onMessageBadFeedback?.(message),
            notifyEditMessage: (message) => onMessageEdit?.(message),
            notifyMessageDelete: (message) => onMessageDelete?.(message),
            notifyMessageReset: (message) => onMessageReset?.(message),
            notifyHintClick: (hint) => onHintClick?.(hint),
        })
    );

    const currentChats = $derived(chats ?? EMPTY_CHATS);
    const currentHints = $derived(hints ?? EMPTY_HINTS);

    // a busy log defers announcements, so a streamed reply is read once it settles
    const streaming = $derived(isUnfinishedStatus(currentChats.at(-1)?.status));
    const prefix = cssClasses.PREFIX;

    setAIChatDialogueContext({
        view: {
            get align() {
                return align;
            },
            get disabledFileItemClick() {
                return disabledFileItemClick;
            },
            get escapeHtml() {
                return escapeHtml;
            },
            get markdownRenderProps() {
                return markdownRenderProps;
            },
            get mode() {
                return mode;
            },
            get selecting() {
                return selecting;
            },
            get showReference() {
                return showReference;
            },
            get showReset() {
                return showReset;
            },
        },
        snippets: {
            get avatar() {
                return avatar;
            },
            get title() {
                return title;
            },
            get content() {
                return content;
            },
            get action() {
                return action;
            },
            get fullDialogue() {
                return fullDialogue;
            },
            get contentItem() {
                return contentItem;
            },
            get messageText() {
                return messageText;
            },
            get messageEdit() {
                return messageEdit;
            },
        },
        selectChange: foundation.handleSelectOrRemove,
        annotationClick: (annotations) => onAnnotationClick?.(annotations),
        fileClick: (file) => onFileClick?.(file),
        imageClick: (image) => onImageClick?.(image),
        referenceClick: (item) => onReferenceClick?.(item),
        messageCopy: (message) => onMessageCopy?.(message),
        messageShare: (message) => onMessageShare?.(message),
        messageGoodFeedback: foundation.likeMessage,
        messageBadFeedback: foundation.dislikeMessage,
        messageReset: foundation.resetMessage,
        messageEdit: foundation.editMessage,
        messageDelete: foundation.deleteMessage,
    });

    // the button unmounts once the list is at the bottom; focus moves to the list instead of falling to the body
    const handoverBackBottomFocus = (element: HTMLElement) => () => handoverFocus(element, list);

    export function selectAll() {
        foundation.handleSelectAll();
    }

    export function deselectAll() {
        foundation.handleDeselectAll();
    }

    export function scrollToBottom(animation?: boolean) {
        foundation.scrollToBottom(animation);
    }

    export function scrollToTop(animation?: boolean) {
        foundation.scrollToTop(animation);
    }
</script>

<div {...rest} class={[prefix, rest.class]} role={namedRole(rest)}>
    <div aria-busy={streaming} aria-label={locale().locale.messages} bind:this={list} class="{prefix}-list" role="log" tabindex="-1" onscroll={foundation.containerScroll}>
        {#each currentChats as chat, index (chat.id)}
            <Dialogue isLastChat={index === currentChats.length - 1} isSelected={states().selectedIds.has(chat.id)} message={chat} role={roleConfig[chat.role]} />
        {/each}
        {#if currentHints.length > 0}
            <DialogueHint class={hintCls} {hintBox} hints={currentHints} onHintClick={foundation.handleHintClick} {selecting} style={hintStyle} />
        {/if}
    </div>
    {#if states().backBottomVisible}
        <span {@attach handoverBackBottomFocus} class="{prefix}-backBottom">
            <Button aria-label={locale().locale.backToBottom} class="{prefix}-backBottom-button" type="tertiary" onclick={foundation.scrollToBottomWithAnimation}>
                {#snippet icon()}
                    <IconChevronDown size="extra-large" />
                {/snippet}
            </Button>
        </span>
    {/if}
</div>
