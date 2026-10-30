<script lang="ts" module>
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';

    // shared, so a dialogue without chats or hints compares its list as unchanged
    const EMPTY_CHATS: Message[] = [];
    const EMPTY_HINTS: string[] = [];
    // listKey() holds the chats entries first, then the hints entries
    const CHATS_PART = 5;
</script>

<script lang="ts">
    import { tick, untrack } from 'svelte';
    import { cssClasses, isUnfinishedStatus } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import DialogueFoundation, { type DialogueAdapter, type DialogueBaseProps } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import '@fibrae/semi-ai-foundation/ai-chat-dialogue/ai-chat-dialogue.scss';
    import { IconChevronDown } from '@fibrae/semi-icons-svelte';
    import { groupRole } from '@fibrae/semi-ui-svelte/_base/group-role';
    import useDefaultProps from '@fibrae/semi-ui-svelte/_base/use-default-props';
    import useFoundation from '@fibrae/semi-ui-svelte/_base/use-foundation.svelte.js';
    import watch from '@fibrae/semi-ui-svelte/_base/watch.svelte.js';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { setAIChatDialogueContext } from './context.js';
    import DialogueHint from './dialogue-hint.svelte';
    import Dialogue from './dialogue.svelte';
    import type { AIChatDialogueProps } from './interface.js';

    interface AIChatDialogueStates {
        selectedIds: Set<string>;
        backBottomVisible: boolean;
    }

    type Foundation = DialogueFoundation<DialogueBaseProps, AIChatDialogueStates>;
    type Adapter = DialogueAdapter<DialogueBaseProps, AIChatDialogueStates>;

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
    let snapshot = untrack(() => ({ chats: [...(chats ?? EMPTY_CHATS)], hints: [...(hints ?? EMPTY_HINTS)] }));
    let listUpdating = false;

    // set by a list the dialogue writes itself, so the update that write causes does not report it again
    let ownWrite = false;

    const { foundation, states } = useFoundation<Foundation, Adapter, DialogueBaseProps, AIChatDialogueStates>(
        DialogueFoundation,
        {
            get chats() {
                return chats;
            },
        },
        () => ({ selectedIds: new Set<string>(), backBottomVisible: false }),
        (base) => ({
            getContainerRef: () => list as HTMLDivElement,
            updateSelected: (ids) => base.setState({ selectedIds: ids }),
            notifySelect: (ids) => onSelect?.(ids),
            notifyChatsChange: (next) => {
                if (listUpdating) {
                    if (!ownWrite) {
                        onChatsChange?.(next);
                    }
                    return;
                }
                ownWrite = true;
                chats = next;
                // cleared once the update this write causes has run; a setter that rejected the write leaves none to skip
                void tick().then(() => {
                    ownWrite = false;
                });
                onChatsChange?.(next);
            },
            notifyLikeMessage: (message) => onMessageGoodFeedback?.(message),
            notifyDislikeMessage: (message) => onMessageBadFeedback?.(message),
            notifyEditMessage: (message) => onMessageEdit?.(message),
            notifyMessageDelete: (message) => onMessageDelete?.(message),
            notifyMessageReset: (message) => onMessageReset?.(message),
            notifyHintClick: (hint) => onHintClick?.(hint),
            setBackBottomVisible: (visible) => base.setState({ backBottomVisible: visible }),
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

    // A caller may push messages into a $state list and append to the last message's text in place, so the list is
    // compared by what those edits change. Known limitation: other in-place edits (deep content text, a lone status
    // flip) re-render but are not reported or followed, as the snapshot shares message objects; upgrade when such an
    // edit needs following.
    const listKey = () => {
        const all = chats ?? EMPTY_CHATS;
        const allHints = hints ?? EMPTY_HINTS;
        const last = all.at(-1);
        const text = last?.content;
        return [all, all.length, last?.id, text, text?.length, allHints, allHints.length] as const;
    };

    let previousKey = untrack(() => listKey());

    // the button unmounts once the list is at the bottom; focus moves to the list instead of falling to the body
    const handoverBackBottomFocus = (element: HTMLElement) => () => handoverFocus(element, list);

    watch(listKey, (next) => {
        const previous = previousKey;
        previousKey = next;
        const changed = (from: number, to: number) => next.slice(from, to).some((value, index) => value !== previous[from + index]);
        if (!changed(0, next.length)) {
            return;
        }
        const current = { chats: chats ?? EMPTY_CHATS, hints: hints ?? EMPTY_HINTS };
        listUpdating = true;
        // an unchanged part is passed as the same array, so the foundation does not report it as new
        foundation.handleListUpdate(
            {
                chats: changed(0, CHATS_PART) ? snapshot.chats : current.chats,
                hints: changed(CHATS_PART, next.length) ? snapshot.hints : current.hints,
            },
            current
        );
        listUpdating = false;
        ownWrite = false;
        snapshot = { chats: [...current.chats], hints: [...current.hints] };
    });

    export function selectAll() {
        foundation.handleSelectAll();
    }

    export function deselectAll() {
        foundation.handleDeselectAll();
    }

    export function scrollToBottom(animation?: boolean) {
        if (animation) {
            foundation.scrollToBottomWithAnimation();
        } else {
            foundation.scrollToBottomImmediately();
        }
    }

    export function scrollToTop(animation?: boolean) {
        if (animation) {
            foundation.scrollToTopWithAnimation();
        } else {
            foundation.scrollToTopImmediately();
        }
    }
</script>

<div {...rest} class={[prefix, rest.class]} role={groupRole(rest)}>
    <div aria-busy={streaming} aria-label={locale().locale.messages} bind:this={list} class="{prefix}-list" role="log" tabindex="-1" onscroll={foundation.containerScroll}>
        {#each currentChats as chat, index (chat.id)}
            <Dialogue isLastChat={index === currentChats.length - 1} isSelected={states().selectedIds.has(chat.id)} message={chat} role={roleConfig[chat.role]} />
        {/each}
        {#if currentHints.length > 0}
            <DialogueHint class={hintCls} {hintBox} hints={currentHints} onHintClick={foundation.onHintClick} {selecting} style={hintStyle} />
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
