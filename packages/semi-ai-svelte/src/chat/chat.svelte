<script lang="ts" module>
    import type { ChatMessage } from './interface.js';

    // shared, so a chat without chats or hints compares its list as unchanged
    const EMPTY_CHATS: ChatMessage[] = [];
    const EMPTY_HINTS: string[] = [];
</script>

<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses, isUnfinishedMessageStatus, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import ChatFoundation, { type ChatAdapter } from '@fibrae/semi-ai-foundation/chat/foundation';
    import { cssClasses as toastCssClasses } from '@fibrae/semi-foundation/toast/constants';
    import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
    import '@fibrae/semi-ai-foundation/chat/chat.scss';
    import { IconChevronDown, IconDisc } from '@fibrae/semi-icons-svelte';
    import { groupRole } from '@fibrae/semi-ui-svelte/_base/group-role';
    import useDefaultProps from '@fibrae/semi-ui-svelte/_base/use-default-props';
    import useFoundation from '@fibrae/semi-ui-svelte/_base/use-foundation.svelte.js';
    import watch from '@fibrae/semi-ui-svelte/_base/watch.svelte.js';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import Divider from '@fibrae/semi-ui-svelte/divider/divider.svelte';
    import { observeResize, useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import ToastList from '@fibrae/semi-ui-svelte/toast/toast-list.svelte';
    import { createToastHookApi } from '@fibrae/semi-ui-svelte/toast/use-toast';
    import type { FileItem } from '@fibrae/semi-ui-svelte/upload/interface';
    import ChatBox from './chat-box.svelte';
    import { setChatContext } from './context.js';
    import Hint from './hint.svelte';
    import InputBox from './input-box.svelte';
    import type { ChatProps } from './interface.js';

    interface ChatState {
        backBottomVisible: boolean;
        uploadAreaVisible: boolean;
    }

    type Foundation = ChatFoundation<ChatProps, ChatState>;
    type Adapter = ChatAdapter<ChatProps, ChatState>;
    type DragEventOnRoot = DragEvent & { currentTarget: EventTarget & HTMLDivElement };

    const defaults = useDefaultProps('Chat');

    let {
        chats = $bindable(),
        align = defaults('align', 'leftRight'),
        canSend = defaults('canSend'),
        customMarkDownComponents = defaults('customMarkDownComponents'),
        enableUpload = defaults('enableUpload', true),
        escapeHtml = defaults('escapeHtml', true),
        hintCls = defaults('hintCls'),
        hints = defaults('hints'),
        hintStyle = defaults('hintStyle'),
        inputBoxCls = defaults('inputBoxCls'),
        inputBoxStyle = defaults('inputBoxStyle'),
        markdownRenderProps = defaults('markdownRenderProps'),
        mode = defaults('mode', 'bubble'),
        placeholder = defaults('placeholder'),
        roleConfig = defaults('roleConfig'),
        sendHotKey = defaults('sendHotKey', 'enter'),
        showClearContext = defaults('showClearContext', false),
        showStopGenerate = defaults('showStopGenerate', false),
        uploadProps = defaults('uploadProps'),
        uploadTipProps = defaults('uploadTipProps'),
        onChatsChange,
        onClear,
        onHintClick,
        onInputChange,
        onMessageBadFeedback,
        onMessageCopy,
        onMessageDelete,
        onMessageGoodFeedback,
        onMessageReset,
        onMessageSend,
        onStopGenerator,
        topSlot,
        bottomSlot,
        title,
        avatar,
        roleAvatar,
        content,
        action,
        fullChatBox,
        inputArea,
        hintBox,
        divider,
        uploadButton,
        uploadTip,
        ...rest
    }: ChatProps = $props();

    const locale = useLocale('Chat');

    let container: HTMLDivElement | undefined = $state();
    let dropArea: HTMLDivElement | undefined = $state();
    let inputBox = $state<ReturnType<typeof InputBox>>();

    // what the last report compared against; a shallow copy, so an in-place push is told from the list before it
    let previousChats = untrack(() => [...(chats ?? EMPTY_CHATS)]);
    let previousHints = untrack(() => [...(hints ?? EMPTY_HINTS)]);
    const toastStore = new ToastListStore();

    const { foundation, states } = useFoundation<Foundation, Adapter, ChatProps, ChatState>(
        ChatFoundation,
        {
            get chats() {
                return chats;
            },
        },
        () => ({ backBottomVisible: false, uploadAreaVisible: false }),
        (base) => ({
            getContainerRef: () => container as HTMLDivElement,
            notifyChatsChange: (next) => {
                chats = next;
                onChatsChange?.(next);
            },
            notifyLikeMessage: (message) => onMessageGoodFeedback?.(message),
            notifyDislikeMessage: (message) => onMessageBadFeedback?.(message),
            notifyMessageDelete: (message) => onMessageDelete?.(message),
            notifyMessageReset: (message) => onMessageReset?.(message),
            notifyClearContext: () => onClear?.(),
            notifyMessageSend: (text, attachment) => onMessageSend?.(text, attachment),
            notifyInputChange: (value) => onInputChange?.(value),
            setBackBottomVisible: (visible) => {
                if (base.getState('backBottomVisible') !== visible) {
                    base.setState({ backBottomVisible: visible });
                }
            },
            notifyStopGenerate: (event) => onStopGenerator?.(event),
            notifyHintClick: (hint) => onHintClick?.(hint),
            setUploadAreaVisible: (visible) => base.setState({ uploadAreaVisible: visible }),
            manualUpload: (files) => inputBox?.insertFiles(files),
            getDropAreaElement: () => dropArea as HTMLDivElement,
        })
    );

    const toast = createToastHookApi(toastStore);
    const { PREFIX, PREFIX_DIVIDER } = cssClasses;
    const { ROLE } = strings;
    const currentChats = $derived(chats ?? EMPTY_CHATS);

    // a busy log defers announcements, so a streamed reply is read once it settles
    const streaming = $derived(isUnfinishedMessageStatus(currentChats.at(-1)?.status));
    const generating = $derived(showStopGenerate && streaming);
    const uploadWays = $derived(ChatFoundation.getUploadProps(enableUpload, uploadProps?.disabled));
    const showBackBottom = $derived(states().backBottomVisible && !generating);

    setChatContext({
        view: {
            get align() {
                return align;
            },
            get customMarkDownComponents() {
                return customMarkDownComponents;
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
            get roleConfig() {
                return roleConfig;
            },
        },
        snippets: {
            get title() {
                return title;
            },
            get avatar() {
                return avatar;
            },
            get roleAvatar() {
                return roleAvatar;
            },
            get content() {
                return content;
            },
            get action() {
                return action;
            },
            get fullChatBox() {
                return fullChatBox;
            },
        },
        toast,
        likeMessage: foundation.likeMessage,
        dislikeMessage: foundation.dislikeMessage,
        resetMessage: foundation.resetMessage,
        deleteMessage: foundation.deleteMessage,
        copyMessage: (message) => onMessageCopy?.(message),
    });

    // The root's own listeners run after Chat's, so a listener that stops propagation cannot starve the drop area
    const onDragOver = (event: DragEventOnRoot) => {
        if (uploadWays.dragUpload) {
            foundation.handleDragOver(event);
        }
        rest.ondragover?.(event);
    };

    const onDragStart = (event: DragEventOnRoot) => {
        if (uploadWays.dragUpload) {
            foundation.handleDragStart();
        }
        rest.ondragstart?.(event);
    };

    const onDragEnd = (event: DragEventOnRoot) => {
        if (uploadWays.dragUpload) {
            foundation.handleDragEnd();
        }
        rest.ondragend?.(event);
    };

    // the stop and back-to-bottom buttons go away on their own; focus moves to the input instead of falling to the body
    const handoverToInput = (element: HTMLElement) => () => handoverFocus(element, inputBox?.getTextarea());

    // Known limitation: the list is compared by its reference, length, last message and that message's text length, so
    // a push and a text appended in place are followed; other in-place edits (a deep content edit, a lone status flip)
    // render but are not followed, as the snapshot shares message objects.
    watch(
        () => {
            const all = chats ?? EMPTY_CHATS;
            const last = all.at(-1);
            const text = last?.content;
            return [all, all.length, last?.id, last?.status, typeof text === 'string' || Array.isArray(text) ? text.length : text] as const;
        },
        () => {
            const next = chats ?? EMPTY_CHATS;
            foundation.handleChatsChange(next, previousChats);
            previousChats = [...next];
        }
    );

    watch(
        () => hints?.length,
        () => {
            const next = hints ?? EMPTY_HINTS;
            foundation.handleHintsChange(next, previousHints);
            previousHints = [...next];
        }
    );

    export function resetMessage() {
        // no message started this reset, so onMessageReset reports null
        foundation.resetMessage(null);
    }

    export function clearContext() {
        foundation.clearContext(null);
    }

    export function scrollToBottom(animation?: boolean) {
        if (animation) {
            foundation.scrollToBottomWithAnimation();
        } else {
            foundation.scrollToBottomImmediately();
        }
    }

    export function sendMessage(text: string, attachment?: FileItem[]) {
        foundation.onMessageSend(text, attachment);
    }
</script>

<div {...rest} class={[PREFIX, rest.class]} role={groupRole(rest)} ondragend={onDragEnd} ondragover={onDragOver} ondragstart={onDragStart}>
    {#if uploadWays.dragUpload && states().uploadAreaVisible}
        <div bind:this={dropArea} class="{PREFIX}-dropArea" role="presentation" ondragleave={foundation.handleContainerDragLeave} ondragover={foundation.handleContainerDragOver} ondrop={foundation.handleContainerDrop}>
            <span class="{PREFIX}-dropArea-text">{locale().locale.dropAreaText}</span>
        </div>
    {/if}
    <div class="{PREFIX}-inner">
        {@render topSlot?.()}
        <div class="{PREFIX}-content">
            <div {@attach observeResize(foundation.handleScrollContainerResize)} aria-busy={streaming} aria-label={locale().locale.messages} bind:this={container} class="{PREFIX}-container" role="log" tabindex="-1" onscroll={foundation.containerScroll}>
                {#each currentChats as item, index (item.id)}
                    {#if item.role === ROLE.DIVIDER}
                        {#if divider}
                            {@render divider({ message: item })}
                        {:else}
                            <Divider class={PREFIX_DIVIDER}>{locale().locale.clearContext}</Divider>
                        {/if}
                    {:else}
                        <ChatBox continueSend={index > 0 && item.role === currentChats[index - 1].role} isLast={index === currentChats.length - 1} message={item} />
                    {/if}
                {/each}
                {#if hints?.length}
                    <Hint class={hintCls} {hintBox} {hints} onHintClick={foundation.onHintClick} style={hintStyle} />
                {/if}
            </div>
            <!-- outside the log: a toast inside it would be announced as one more log entry -->
            <div class="{PREFIX}-toast">
                <div class={toastCssClasses.WRAPPER} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}><ToastList store={toastStore} /></div>
            </div>
        </div>
        {#if showBackBottom}
            <span {@attach handoverToInput} class="{PREFIX}-action">
                <Button aria-label={locale().locale.backToBottom} class="{PREFIX}-action-content {PREFIX}-action-backBottom" type="tertiary" onclick={foundation.scrollToBottomWithAnimation}>
                    {#snippet icon()}
                        <IconChevronDown size="extra-large" />
                    {/snippet}
                </Button>
            </span>
        {/if}
        {#if generating}
            <span {@attach handoverToInput} class="{PREFIX}-action">
                <Button class="{PREFIX}-action-content {PREFIX}-action-stop" type="tertiary" onclick={foundation.stopGenerate}>
                    {#snippet icon()}
                        <IconDisc size="extra-large" />
                    {/snippet}
                    {locale().locale.stop}
                </Button>
            </span>
        {/if}
        <InputBox
            bind:this={inputBox}
            {canSend}
            clickUpload={uploadWays.clickUpload}
            disableSend={generating}
            dragUpload={uploadWays.dragUpload}
            {inputArea}
            {inputBoxCls}
            {inputBoxStyle}
            onClear={() => foundation.clearContext(null)}
            onInputChange={foundation.onInputChange}
            onSend={foundation.onMessageSend}
            pasteUpload={uploadWays.pasteUpload}
            {placeholder}
            {sendHotKey}
            {showClearContext}
            {uploadButton}
            {uploadProps}
            {uploadTip}
            {uploadTipProps}
        />
        {@render bottomSlot?.()}
    </div>
</div>
