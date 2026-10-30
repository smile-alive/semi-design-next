import { type JSX, Show, createMemo, onCleanup, untrack } from 'solid-js';
import clsx from 'clsx';
import ChatBoxActionFoundation, { type ChatBoxActionAdapter } from '@fibrae/semi-ai-foundation/chat/chat-box-action-foundation';
import { cssClasses, isUnfinishedMessageStatus, strings } from '@fibrae/semi-ai-foundation/chat/constants';
import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
import { IconCopyStroked, IconDeleteStroked, IconLikeThumb, IconRedoStroked, IconThumbUpStroked } from '@fibrae/semi-icons-solid';
import useFoundation from '@fibrae/semi-ui-solid/_base/use-foundation';
import Button from '@fibrae/semi-ui-solid/button/index';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import Popconfirm from '@fibrae/semi-ui-solid/popconfirm/index';
import { useChatContext } from './context';
import type { DefaultActionNodeObj, Message, RenderActionProps } from './interface';

const { PREFIX_CHAT_BOX_ACTION } = cssClasses;
const { ROLE, MESSAGE_STATUS } = strings;

interface ChatBoxActionProps {
    message: Message;
    isLast: boolean;
    customRenderFunc?: (props: RenderActionProps) => JSX.Element;
}

interface ChatBoxActionState {
    visible: boolean;
    showAction: boolean;
}

type Foundation = ChatBoxActionFoundation<ChatBoxActionProps, ChatBoxActionState>;
type Adapter = ChatBoxActionAdapter<ChatBoxActionProps, ChatBoxActionState>;

type ActionKey = keyof DefaultActionNodeObj;

export default function ChatBoxAction(props: ChatBoxActionProps) {
    const chat = useChatContext('ChatBoxAction');
    const locale = useLocale('Chat');

    let trigger: HTMLButtonElement | undefined;
    let confirmed = false;

    const { foundation, state } = useFoundation<Foundation, Adapter, ChatBoxActionProps, ChatBoxActionState>(
        ChatBoxActionFoundation,
        props,
        () => ({ visible: false, showAction: false }),
        (base) => ({
            notifyDeleteMessage: () => chat.deleteMessage(props.message),
            notifyMessageCopy: () => chat.copyMessage(props.message),
            toastCopySuccess: () => chat.toast.success({ content: locale().locale.copySuccess }),
            notifyLikeMessage: () => chat.likeMessage(props.message),
            notifyDislikeMessage: () => chat.dislikeMessage(props.message),
            notifyResetMessage: () => chat.resetMessage(props.message),
            setVisible: (visible) => base.setState({ visible }),
            setShowAction: (showAction) => base.setState({ showAction }),
        })
    );

    const btnCls = `${PREFIX_CHAT_BOX_ACTION}-btn`;

    // a new render config object carrying the same renderer must not call it again
    const customRender = createMemo(() => props.customRenderFunc);

    const actionNodes: Record<ActionKey, () => JSX.Element> = {
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
                onClickOutSide={foundation.hideDeletePopup}
                // trigger="custom" ignores Esc, and confirm or cancel only report through onVisibleChange
                onConfirm={() => {
                    confirmed = true;
                    foundation.deleteMessage();
                }}
                onEscKeyDown={foundation.hideDeletePopup}
                onVisibleChange={(isVisible) => {
                    if (!isVisible) {
                        foundation.hideDeletePopup();
                    }
                }}
            >
                {(getTriggerProps) => <Button {...getTriggerProps({ ref: (node: HTMLButtonElement) => (trigger = node) })} type="tertiary" class={btnCls} aria-label={locale().locale.delete} theme="borderless" icon={<IconDeleteStroked />} onClick={foundation.showDeletePopup} />}
            </Popconfirm>
        ),
    };

    const status = () => props.message.status ?? MESSAGE_STATUS.COMPLETE;

    const complete = () => status() === MESSAGE_STATUS.COMPLETE;

    const showFeedback = () => props.message.role !== ROLE.USER && complete();

    const showReset = () => props.isLast && props.message.role === ROLE.ASSISTANT;

    // compared by content: the custom renderer is called again only when the set of buttons changes
    const shownKeys = createMemo(
        () => {
            const keys: ActionKey[] = [];
            if (complete()) {
                keys.push('copyNode');
            }
            if (showFeedback()) {
                keys.push('likeNode', 'dislikeNode');
            }
            if (showReset()) {
                keys.push('resetNode');
            }
            keys.push('deleteNode');
            return keys;
        },
        [],
        { equals: (a, b) => a.join() === b.join() }
    );

    const finished = () => !isUnfinishedMessageStatus(status());

    const wrapCls = () =>
        clsx(PREFIX_CHAT_BOX_ACTION, {
            [`${PREFIX_CHAT_BOX_ACTION}-show`]: (showReset() && finished()) || state().showAction,
            [`${PREFIX_CHAT_BOX_ACTION}-hidden`]: !finished(),
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
                    <Show when={complete()}>{actionNodes.copyNode()}</Show>
                    <Show when={showFeedback()}>
                        {actionNodes.likeNode()}
                        {actionNodes.dislikeNode()}
                    </Show>
                    <Show when={showReset()}>{actionNodes.resetNode()}</Show>
                    {actionNodes.deleteNode()}
                </div>
            }
        >
            {customActions()}
        </Show>
    );
}
