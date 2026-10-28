import { type ReactNode, useEffect, useRef } from 'react';
import clsx from 'clsx';
import ChatBoxActionFoundation, { type ChatBoxActionAdapter } from '@fibrae/semi-ai-foundation/chat/chat-box-action-foundation';
import { cssClasses, isUnfinishedMessageStatus, strings } from '@fibrae/semi-ai-foundation/chat/constants';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
import { IconThumbUpStroked, IconDeleteStroked, IconCopyStroked, IconLikeThumb, IconRedoStroked } from '@fibrae/semi-icons-react';
import useFoundation from '@fibrae/semi-ui-react/_base/use-foundation';
import Button from '@fibrae/semi-ui-react/button/index';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';
import Popconfirm from '@fibrae/semi-ui-react/popconfirm/index';
import type { ChatBoxProps, DefaultActionNodeObj, Metadata, RenderActionProps } from '../interface';

const prefix = cssClasses.PREFIX;
const { PREFIX_CHAT_BOX_ACTION } = cssClasses;
const { ROLE, MESSAGE_STATUS } = strings;

interface ChatBoxActionProps extends ChatBoxProps {
    role?: Metadata;
    customRenderFunc?: (props: RenderActionProps) => ReactNode;
}

interface ChatBoxActionState {
    visible: boolean;
    showAction: boolean;
}

export default function ChatBoxAction(props: ChatBoxActionProps) {
    const { message = {}, isLast, customRenderFunc } = props;

    const { locale } = useLocale('Chat');

    const popconfirmTriggerRef = useRef<HTMLButtonElement>(null);
    const leftFocus = useRef<{ trigger: HTMLElement; container: HTMLElement | null } | null>(null);

    const [foundation, state] = useFoundation<ChatBoxActionFoundation, ChatBoxActionAdapter<ChatBoxActionProps, ChatBoxActionState>, ChatBoxActionProps, ChatBoxActionState>(
        ChatBoxActionFoundation,
        props,
        () => ({ visible: false, showAction: false }),
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
                setVisible: (visible) => base.setState({ visible }),
                setShowAction: (showAction) => base.setState({ showAction }),
            };
        }
    );

    const { visible, showAction } = state;
    const { role, status = MESSAGE_STATUS.COMPLETE, like, dislike } = message;
    const complete = status === MESSAGE_STATUS.COMPLETE;
    const showFeedback = role !== ROLE.USER && complete;
    const showReset = isLast && role === ROLE.ASSISTANT;
    const finished = !isUnfinishedMessageStatus(status);

    const wrapCls = clsx(PREFIX_CHAT_BOX_ACTION, {
        [`${PREFIX_CHAT_BOX_ACTION}-show`]: (showReset && finished) || showAction,
        [`${PREFIX_CHAT_BOX_ACTION}-hidden`]: !finished,
    });

    const actions: DefaultActionNodeObj = {};

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

    if (complete) {
        actions.copyNode = <Button key="copy" type="tertiary" className={`${PREFIX_CHAT_BOX_ACTION}-btn`} aria-label={locale.copy} theme="borderless" icon={<IconCopyStroked />} onClick={foundation.copyMessage} />;
    }

    if (showFeedback) {
        actions.likeNode = <Button key="like" type="tertiary" className={`${PREFIX_CHAT_BOX_ACTION}-btn`} aria-label={locale.like} aria-pressed={Boolean(like)} theme="borderless" icon={like ? <IconLikeThumb /> : <IconThumbUpStroked />} onClick={foundation.likeMessage} />;
        actions.dislikeNode = (
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
    }

    if (showReset) {
        actions.resetNode = <Button key="reset" type="tertiary" className={`${PREFIX_CHAT_BOX_ACTION}-btn`} aria-label={locale.regenerate} theme="borderless" icon={<IconRedoStroked className={`${PREFIX_CHAT_BOX_ACTION}-icon-redo`} />} onClick={foundation.resetMessage} />;
    }

    actions.deleteNode = (
        <Popconfirm
            key="delete"
            title={<LocaleConsumer componentName="Chat">{(locale: Locale['Chat']) => locale['deleteConfirm']}</LocaleConsumer>}
            position="top"
            trigger="custom"
            visible={visible}
            onClickOutSide={foundation.hideDeletePopup}
            // trigger="custom" ignores Esc, and confirm or cancel only report through onVisibleChange
            onConfirm={() => {
                const trigger = popconfirmTriggerRef.current;
                leftFocus.current = trigger && { trigger, container: trigger.closest<HTMLElement>(`.${prefix}-container`) };
                foundation.deleteMessage();
            }}
            onEscKeyDown={foundation.hideDeletePopup}
            onVisibleChange={(isVisible) => {
                if (!isVisible) {
                    foundation.hideDeletePopup();
                }
            }}
        >
            <Button ref={popconfirmTriggerRef} type="tertiary" className={`${PREFIX_CHAT_BOX_ACTION}-btn`} aria-label={locale.delete} theme="borderless" icon={<IconDeleteStroked />} onClick={foundation.showDeletePopup} />
        </Popconfirm>
    );

    const defaultActions = Object.values(actions);

    if (customRenderFunc && typeof customRenderFunc === 'function') {
        return customRenderFunc({
            message,
            defaultActions,
            className: wrapCls,
            defaultActionsObj: actions,
        });
    }

    return <div className={wrapCls}>{defaultActions}</div>;
}
