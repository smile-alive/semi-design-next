import { For, type JSX, Show, createMemo, onCleanup, untrack } from 'solid-js';
import clsx from 'clsx';
import ChatBoxActionFoundation, { type ChatBoxActionAdapter, type ChatBoxActionKey, type ChatBoxActionState, getChatBoxActionFlags, getChatBoxActionKeys } from '@fibrae/semi-ai-foundation/components/chat/chat-box-action-foundation';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/chat/constants';
import { handoverFocus } from '@fibrae/semi-foundation/utils';
import { IconCopyStroked, IconDeleteStroked, IconLikeThumb, IconRedoStroked, IconThumbUpStroked } from '@fibrae/semi-icons-solid';
import { useFoundation } from '@fibrae/semi-ui-solid/base';
import Button from '@fibrae/semi-ui-solid/button/index';
import Popconfirm from '@fibrae/semi-ui-solid/popconfirm/index';
import { useLocale } from '@fibrae/semi-ui-solid/primitives';
import { useChatContext } from '../context';
import type { Message, RenderActionProps } from '../interface';

const { PREFIX_CHAT_BOX_ACTION } = cssClasses;

interface ChatBoxActionProps {
    message: Message;
    isLast: boolean;
    customRenderFunc?: (props: RenderActionProps) => JSX.Element;
}

type Foundation = ChatBoxActionFoundation<ChatBoxActionProps>;
type Adapter = ChatBoxActionAdapter<ChatBoxActionProps>;

export default function ChatBoxAction(props: ChatBoxActionProps) {
    const chat = useChatContext('ChatBoxAction');
    const locale = useLocale('Chat');

    let trigger: HTMLButtonElement | undefined;
    let confirmed = false;

    const { foundation, state } = useFoundation<Foundation, Adapter, ChatBoxActionProps, ChatBoxActionState>(
        ChatBoxActionFoundation,
        props,
        () => ChatBoxActionFoundation.getInitialState(),
        () => ({
            notifyDeleteMessage: () => chat.deleteMessage(props.message),
            notifyMessageCopy: () => chat.copyMessage(props.message),
            toastCopySuccess: () => chat.toast.success({ content: locale().locale.copySuccess }),
            notifyLikeMessage: () => chat.likeMessage(props.message),
            notifyDislikeMessage: () => chat.dislikeMessage(props.message),
            notifyResetMessage: () => chat.resetMessage(props.message),
        })
    );

    const btnCls = `${PREFIX_CHAT_BOX_ACTION}-btn`;

    // a new render config object carrying the same renderer must not call it again
    const customRender = createMemo(() => props.customRenderFunc);

    const actionNodes: Record<ChatBoxActionKey, () => JSX.Element> = {
        copyNode: () => <Button type="tertiary" class={btnCls} aria-label={locale().locale.copy} theme="borderless" icon={<IconCopyStroked />} onClick={foundation.copyMessage} />,
        likeNode: () => <Button type="tertiary" class={btnCls} aria-label={locale().locale.like} aria-pressed={Boolean(props.message.like)} theme="borderless" icon={props.message.like ? <IconLikeThumb /> : <IconThumbUpStroked />} onClick={foundation.likeMessage} />,
        dislikeNode: () => (
            <Button
                type="tertiary"
                class={btnCls}
                aria-label={locale().locale.dislike}
                aria-pressed={Boolean(props.message.dislike)}
                theme="borderless"
                icon={props.message.dislike ? <IconLikeThumb class={`${PREFIX_CHAT_BOX_ACTION}-icon-flip`} /> : <IconThumbUpStroked class={`${PREFIX_CHAT_BOX_ACTION}-icon-flip`} />}
                onClick={foundation.dislikeMessage}
            />
        ),
        resetNode: () => <Button type="tertiary" class={btnCls} aria-label={locale().locale.regenerate} theme="borderless" icon={<IconRedoStroked class={`${PREFIX_CHAT_BOX_ACTION}-icon-redo`} />} onClick={foundation.resetMessage} />,
        deleteNode: () => (
            <Popconfirm
                title={locale().locale.deleteConfirm}
                position="top"
                trigger="custom"
                visible={state().visible}
                onClickOutSide={foundation.closeMenu}
                // trigger="custom" ignores Esc, and confirm or cancel only report through onVisibleChange
                onConfirm={() => {
                    confirmed = true;
                    foundation.deleteMessage();
                }}
                onEscKeyDown={foundation.closeMenu}
                onVisibleChange={(isVisible) => {
                    if (!isVisible) {
                        foundation.closeMenu();
                    }
                }}
            >
                {(getTriggerProps) => <Button {...getTriggerProps({ ref: (node: HTMLButtonElement) => (trigger = node) })} type="tertiary" class={btnCls} aria-label={locale().locale.delete} theme="borderless" icon={<IconDeleteStroked />} onClick={foundation.openMenu} />}
            </Popconfirm>
        ),
    };

    const flags = () => getChatBoxActionFlags({ role: props.message.role, status: props.message.status, isLast: props.isLast });

    // compared by content: the custom renderer is called again only when the set of buttons changes
    const shownKeys = createMemo(() => getChatBoxActionKeys(flags()), [], { equals: (a, b) => a.join() === b.join() });

    const wrapCls = () =>
        clsx(PREFIX_CHAT_BOX_ACTION, {
            [`${PREFIX_CHAT_BOX_ACTION}-show`]: ChatBoxActionFoundation.isActionBarShown({ showReset: flags().showReset, finished: flags().finished, showAction: state().showAction }),
            [`${PREFIX_CHAT_BOX_ACTION}-hidden`]: !flags().finished,
        });

    // called again when the renderer or the set of buttons changes; what the renderer reads itself is not tracked
    const customActions = () => {
        const render = customRender();
        const keys = shownKeys();
        // Render functions, so a button exists only where the custom bar calls one: a button created but left out of
        // the bar is never inserted, which shifts the hydration keys after it.
        return untrack(() =>
            render?.({
                get message() {
                    return props.message;
                },
                defaultActions: keys.map((key) => actionNodes[key]),
                get class() {
                    return wrapCls();
                },
                defaultActionsObj: Object.fromEntries(keys.map((key) => [key, actionNodes[key]])),
            })
        );
    };

    // A confirmed delete removes this message and its focused button; the message list takes the focus instead of the
    // body. Cleanup runs before the DOM is removed, so the handover waits for the update to finish.
    onCleanup(() => {
        const from = trigger;
        if (confirmed && from) {
            const target = chat.container();
            queueMicrotask(() => handoverFocus(from, target));
        }
    });

    return (
        <Show
            when={props.customRenderFunc}
            fallback={
                <div class={wrapCls()}>
                    <For each={shownKeys()}>{(key) => actionNodes[key]()}</For>
                </div>
            }
        >
            {customActions()}
        </Show>
    );
}
