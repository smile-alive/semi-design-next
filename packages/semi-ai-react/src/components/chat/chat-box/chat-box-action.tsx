import { type ReactNode, useEffect, useRef } from 'react';
import clsx from 'clsx';
import ChatBoxActionFoundation, { type ChatBoxActionAdapter, type ChatBoxActionKey, type ChatBoxActionState, getChatBoxActionFlags, getChatBoxActionKeys } from '@fibrae/semi-ai-foundation/components/chat/chat-box-action-foundation';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/chat/constants';
import type { Locale } from '@fibrae/semi-foundation/locale';
import { handoverFocus } from '@fibrae/semi-foundation/utils';
import { IconThumbUpStroked, IconDeleteStroked, IconCopyStroked, IconLikeThumb, IconRedoStroked } from '@fibrae/semi-icons-react';
import { useFoundation } from '@fibrae/semi-ui-react/base';
import Button from '@fibrae/semi-ui-react/button/index';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';
import Popconfirm from '@fibrae/semi-ui-react/popconfirm/index';
import type { ChatBoxProps, DefaultActionNodeObj, Metadata, RenderActionProps } from '../interface';

type Foundation = ChatBoxActionFoundation;
type Adapter = ChatBoxActionAdapter<ChatBoxActionProps>;

const prefix = cssClasses.PREFIX;
const { PREFIX_CHAT_BOX_ACTION } = cssClasses;

interface ChatBoxActionProps extends ChatBoxProps {
    role?: Metadata;
    customRenderFunc?: (props: RenderActionProps) => ReactNode;
}

export default function ChatBoxAction(props: ChatBoxActionProps) {
    const { message = {}, isLast, customRenderFunc } = props;

    const { locale } = useLocale('Chat');

    const popconfirmTriggerRef = useRef<HTMLButtonElement>(null);
    const leftFocus = useRef<{ trigger: HTMLElement; container: HTMLElement | null } | null>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, ChatBoxActionProps, ChatBoxActionState>(
        ChatBoxActionFoundation,
        props,
        () => ChatBoxActionFoundation.getInitialState(),
        (base) => {
            return {
                notifyDeleteMessage: () => {
                    const { message, onMessageDelete } = base.getProps();
                    onMessageDelete?.(message);
                },
                notifyMessageCopy: () => {
                    const { message, onMessageCopy } = base.getProps();
                    onMessageCopy?.(message);
                },
                toastCopySuccess: () => {
                    base.getProps().toast.success({
                        content: <LocaleConsumer componentName="Chat">{(locale: Locale['Chat']) => locale['copySuccess']}</LocaleConsumer>,
                    });
                },
                notifyLikeMessage: () => {
                    const { message, onMessageGoodFeedback } = base.getProps();
                    onMessageGoodFeedback?.(message);
                },
                notifyDislikeMessage: () => {
                    const { message, onMessageBadFeedback } = base.getProps();
                    onMessageBadFeedback?.(message);
                },
                notifyResetMessage: () => {
                    const { message, onMessageReset } = base.getProps();
                    onMessageReset?.(message);
                },
            };
        }
    );

    const { visible, showAction } = state;
    const { like, dislike } = message;
    const flags = getChatBoxActionFlags({ role: message.role, status: message.status, isLast });
    const { finished, showReset } = flags;

    const wrapCls = clsx(PREFIX_CHAT_BOX_ACTION, {
        [`${PREFIX_CHAT_BOX_ACTION}-show`]: ChatBoxActionFoundation.isActionBarShown({ showReset, finished, showAction }),
        [`${PREFIX_CHAT_BOX_ACTION}-hidden`]: !finished,
    });

    const copyNode = <Button key="copy" type="tertiary" className={`${PREFIX_CHAT_BOX_ACTION}-btn`} aria-label={locale.copy} theme="borderless" icon={<IconCopyStroked />} onClick={foundation.copyMessage} />;
    const likeNode = <Button key="like" type="tertiary" className={`${PREFIX_CHAT_BOX_ACTION}-btn`} aria-label={locale.like} aria-pressed={Boolean(like)} theme="borderless" icon={like ? <IconLikeThumb /> : <IconThumbUpStroked />} onClick={foundation.likeMessage} />;

    const dislikeNode = (
        <Button
            key="dislike"
            type="tertiary"
            className={`${PREFIX_CHAT_BOX_ACTION}-btn`}
            aria-label={locale.dislike}
            aria-pressed={Boolean(dislike)}
            theme="borderless"
            icon={dislike ? <IconLikeThumb className={`${PREFIX_CHAT_BOX_ACTION}-icon-flip`} /> : <IconThumbUpStroked className={`${PREFIX_CHAT_BOX_ACTION}-icon-flip`} />}
            onClick={foundation.dislikeMessage}
        />
    );

    const resetNode = <Button key="reset" type="tertiary" className={`${PREFIX_CHAT_BOX_ACTION}-btn`} aria-label={locale.regenerate} theme="borderless" icon={<IconRedoStroked className={`${PREFIX_CHAT_BOX_ACTION}-icon-redo`} />} onClick={foundation.resetMessage} />;

    const deleteNode = (
        <Popconfirm
            key="delete"
            title={<LocaleConsumer componentName="Chat">{(locale: Locale['Chat']) => locale['deleteConfirm']}</LocaleConsumer>}
            position="top"
            trigger="custom"
            visible={visible}
            onClickOutSide={foundation.closeMenu}
            // trigger="custom" ignores Esc, and confirm or cancel only report through onVisibleChange
            onConfirm={() => {
                const trigger = popconfirmTriggerRef.current;
                leftFocus.current = trigger && { trigger, container: trigger.closest<HTMLElement>(`.${prefix}-container`) };
                foundation.deleteMessage();
            }}
            onEscKeyDown={foundation.closeMenu}
            onVisibleChange={(isVisible) => {
                if (!isVisible) {
                    foundation.closeMenu();
                }
            }}
        >
            <Button ref={popconfirmTriggerRef} type="tertiary" className={`${PREFIX_CHAT_BOX_ACTION}-btn`} aria-label={locale.delete} theme="borderless" icon={<IconDeleteStroked />} onClick={foundation.openMenu} />
        </Popconfirm>
    );

    const nodes: Record<ChatBoxActionKey, ReactNode> = { copyNode, likeNode, dislikeNode, resetNode, deleteNode };
    const keys = getChatBoxActionKeys(flags);
    const defaultActions = keys.map((key) => nodes[key]);

    // A confirmed delete removes this message and its focused button; the message list takes the focus instead of the
    // body. The cleanup runs after the commit that removed the DOM.
    useEffect(
        () => () => {
            if (leftFocus.current) {
                handoverFocus(leftFocus.current.trigger, leftFocus.current.container);
            }
        },
        []
    );

    if (customRenderFunc && typeof customRenderFunc === 'function') {
        const actions: DefaultActionNodeObj = Object.fromEntries(keys.map((key) => [key, nodes[key]]));
        return customRenderFunc({
            message,
            defaultActions,
            className: wrapCls,
            defaultActionsObj: actions,
        });
    }

    return <div className={wrapCls}>{defaultActions}</div>;
}
