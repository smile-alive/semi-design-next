import { useRef } from 'react';
import clsx from 'clsx';
import DialogueActionFoundation, { type DialogueActionAdapter, getDialogueActionFlags } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/action-foundation';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
import { IconThumbUpStroked, IconDeleteStroked, IconShareStroked, IconCopyStroked, IconLikeThumb, IconRedoStroked, IconEditStroked, IconMoreStroked } from '@fibrae/semi-icons-react';
import useFoundation from '@fibrae/semi-ui-react/_base/use-foundation';
import Button from '@fibrae/semi-ui-react/button/index';
import Dropdown from '@fibrae/semi-ui-react/dropdown/index';
import { useClickOutside, useLocale } from '@fibrae/semi-ui-react/hooks';
import Modal from '@fibrae/semi-ui-react/modal/index';
import Toast from '@fibrae/semi-ui-react/toast/index';
import type { AIChatDialogueActionProps, DefaultActionNodeObj } from '../interface';

const prefix = cssClasses.PREFIX;
const { PREFIX_ACTION } = cssClasses;

interface AIChatDialogueActionState {
    visible: boolean;
    showAction: boolean;
}

export default function DialogueAction(props: AIChatDialogueActionProps) {
    const { message, isLastChat, customRenderFunc, showReset: showResetProp = true } = props;

    const { locale } = useLocale('AIChatDialogue');

    const triggerRef = useRef<HTMLButtonElement>(null);

    const [foundation, { visible, showAction }] = useFoundation<DialogueActionFoundation, DialogueActionAdapter<AIChatDialogueActionProps, AIChatDialogueActionState>, AIChatDialogueActionProps, AIChatDialogueActionState>(
        DialogueActionFoundation,
        props,
        () => ({ visible: false, showAction: false }),
        (base) => ({
            notifyMessageCopy: () => {
                const { message, onMessageCopy } = base.getProps();
                onMessageCopy?.(message);
            },
            // the toast renders outside this tree, so its text comes from the latest render's LocaleProvider
            toastCopySuccess: () => Toast.success({ content: base.getContexts().locale.copySuccess }),
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
            notifyShareMessage: () => {
                const { message, onMessageShare } = base.getProps();
                onMessageShare?.(message);
            },
            notifyEditMessage: () => {
                const { message, onMessageEdit } = base.getProps();
                onMessageEdit?.(message);
            },
            notifyDeleteMessage: () => {
                const { message, onMessageDelete } = base.getProps();
                onMessageDelete?.(message);
            },
            setVisible: (isVisible: boolean) => base.setState({ visible: isVisible }),
            setShowAction: (isShown: boolean) => base.setState({ showAction: isShown }),
        }),
        { locale }
    );

    const markPressInside = useClickOutside([triggerRef], foundation.hideMoreDropdown, visible);

    const { like, dislike } = message;
    const { completed, finished, showFeedback, showReset, showEdit } = getDialogueActionFlags({ role: message.role, status: message.status, isLastChat, showReset: showResetProp });

    const wrapCls = clsx(PREFIX_ACTION, {
        [`${PREFIX_ACTION}-show`]: (showReset && finished) || showAction,
        [`${PREFIX_ACTION}-hidden`]: !finished,
    });

    const copyNode = <Button key="copy" type="tertiary" className={`${PREFIX_ACTION}-btn`} aria-label={locale.copy} theme="borderless" icon={<IconCopyStroked />} onClick={foundation.copyMessage} />;
    const resetNode = <Button key="reset" type="tertiary" className={`${PREFIX_ACTION}-btn`} aria-label={locale.regenerate} theme="borderless" icon={<IconRedoStroked className={`${PREFIX_ACTION}-icon-redo`} />} onClick={foundation.resetMessage} />;
    const likeNode = <Button key="like" type="tertiary" className={`${PREFIX_ACTION}-btn`} aria-label={locale.like} aria-pressed={Boolean(like)} theme="borderless" icon={like ? <IconLikeThumb /> : <IconThumbUpStroked />} onClick={foundation.likeMessage} />;

    const dislikeNode = (
        <Button
            key="dislike"
            type="tertiary"
            className={`${PREFIX_ACTION}-btn`}
            aria-label={locale.dislike}
            aria-pressed={Boolean(dislike)}
            theme="borderless"
            icon={dislike ? <IconLikeThumb className={`${PREFIX_ACTION}-icon-flip`} /> : <IconThumbUpStroked className={`${PREFIX_ACTION}-icon-flip`} />}
            onClick={foundation.dislikeMessage}
        />
    );

    const shareNode = <Button key="share" type="tertiary" className={`${PREFIX_ACTION}-btn`} aria-label={locale.share} theme="borderless" icon={<IconShareStroked />} onClick={foundation.shareMessage} />;
    const editNode = <Button key="edit" type="tertiary" className={`${PREFIX_ACTION}-btn`} aria-label={locale.edit} theme="borderless" icon={<IconEditStroked />} onClick={foundation.editMessage} />;

    // renders outside this tree, so it gets the text instead of a LocaleConsumer
    const showDeleteModal = () => {
        const trigger = triggerRef.current;
        const list = trigger?.closest<HTMLElement>(`.${prefix}-list`);
        Modal.warning({
            title: locale.deleteConfirm,
            content: locale.deleteContent,
            onOk: foundation.deleteMessage,
            // the deleted message took the more button along; the list takes the focus the modal gives up
            afterClose: () => trigger && handoverFocus(trigger, list),
        });
        foundation.hideMoreDropdown();
    };

    const moreNode = (
        <Dropdown
            key="more"
            className={`${PREFIX_ACTION}-dropdown`}
            position="bottomLeft"
            render={
                <Dropdown.Menu onMouseDownCapture={markPressInside}>
                    <Dropdown.Item onClick={showDeleteModal}>
                        <IconDeleteStroked /> {locale.delete}
                    </Dropdown.Item>
                </Dropdown.Menu>
            }
            spacing={12}
            stopPropagation
            trigger="custom"
            visible={visible}
            onEscKeyDown={foundation.hideMoreDropdown}
        >
            <Button ref={triggerRef} type="tertiary" aria-label={locale.more} theme="borderless" icon={<IconMoreStroked />} onClick={foundation.showMoreDropdown} />
        </Dropdown>
    );

    if (customRenderFunc && typeof customRenderFunc === 'function') {
        const actionNodeObj: DefaultActionNodeObj = {};
        if (completed) {
            actionNodeObj.copyNode = copyNode;
        }
        if (showFeedback) {
            actionNodeObj.likeNode = likeNode;
            actionNodeObj.dislikeNode = dislikeNode;
        }
        if (showReset) {
            actionNodeObj.resetNode = resetNode;
        }
        if (completed) {
            actionNodeObj.shareNode = shareNode;
        }
        if (showEdit) {
            actionNodeObj.editNode = editNode;
        }
        actionNodeObj.moreNode = moreNode;
        return customRenderFunc({
            message,
            defaultActions: Object.values(actionNodeObj),
            className: wrapCls,
            defaultActionsObj: actionNodeObj,
        });
    }

    return (
        <div className={wrapCls}>
            {completed && copyNode}
            {showReset && resetNode}
            {completed && shareNode}
            {showEdit && editNode}
            {showFeedback && likeNode}
            {showFeedback && dislikeNode}
            {moreNode}
        </div>
    );
}
