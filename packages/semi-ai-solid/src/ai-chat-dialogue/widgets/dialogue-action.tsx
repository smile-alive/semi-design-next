import { Show, createMemo, createSignal } from 'solid-js';
import clsx from 'clsx';
import DialogueActionFoundation, { type DialogueActionAdapter, getDialogueActionFlags } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/action-foundation';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
import { IconCopyStroked, IconDeleteStroked, IconEditStroked, IconLikeThumb, IconMoreStroked, IconRedoStroked, IconShareStroked, IconThumbUpStroked } from '@fibrae/semi-icons-solid';
import useFoundation from '@fibrae/semi-ui-solid/_base/use-foundation';
import Button from '@fibrae/semi-ui-solid/button/index';
import Dropdown from '@fibrae/semi-ui-solid/dropdown/index';
import { useClickOutside, useLocale } from '@fibrae/semi-ui-solid/hooks';
import Modal from '@fibrae/semi-ui-solid/modal/index';
import Toast from '@fibrae/semi-ui-solid/toast/index';
import { useAIChatDialogueContext } from '../context';
import type { DefaultActionNodeObj } from '../interface';

interface DialogueActionProps {
    message: Message;
    isLastChat: boolean;
}

interface DialogueActionState {
    visible: boolean;
    showAction: boolean;
}

type Foundation = DialogueActionFoundation<DialogueActionProps, DialogueActionState>;
type Adapter = DialogueActionAdapter<DialogueActionProps, DialogueActionState>;

const prefix = cssClasses.PREFIX;
const { PREFIX_ACTION } = cssClasses;

export default function DialogueAction(props: DialogueActionProps) {
    const context = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const [trigger, setTrigger] = createSignal<HTMLElement>();

    const { foundation, state } = useFoundation<Foundation, Adapter, DialogueActionProps, DialogueActionState>(
        DialogueActionFoundation,
        props,
        () => ({ visible: false, showAction: false }),
        (base) => ({
            notifyMessageCopy: () => context.messageCopy(props.message),
            // the toast renders outside this tree, so its text comes from this component's locale
            toastCopySuccess: () => Toast.success({ content: locale().locale.copySuccess }),
            notifyLikeMessage: () => context.messageGoodFeedback(props.message),
            notifyDislikeMessage: () => context.messageBadFeedback(props.message),
            notifyResetMessage: () => context.messageReset(props.message),
            notifyShareMessage: () => context.messageShare(props.message),
            notifyEditMessage: () => context.messageEdit(props.message),
            notifyDeleteMessage: () => context.messageDelete(props.message),
            setVisible: (visible) => base.setState({ visible }),
            setShowAction: (showAction) => base.setState({ showAction }),
        })
    );

    const markPressInside = useClickOutside(
        [trigger],
        () => foundation.hideMoreDropdown(),
        () => state().visible
    );

    // memos: a new message object (a like, a streamed chunk) must not recreate the buttons a custom bar received
    const flags = () => getDialogueActionFlags({ role: props.message.role, status: props.message.status, isLastChat: props.isLastChat, showReset: context.view().showReset });

    const completed = createMemo(() => flags().completed);
    const finished = createMemo(() => flags().finished);
    const showFeedback = createMemo(() => flags().showFeedback);
    const showReset = createMemo(() => flags().showReset);
    const showEdit = createMemo(() => flags().showEdit);

    const wrapCls = () =>
        clsx(PREFIX_ACTION, {
            [`${PREFIX_ACTION}-show`]: (showReset() && finished()) || state().showAction,
            [`${PREFIX_ACTION}-hidden`]: !finished(),
        });

    // the warning renders outside this tree, so it gets the text instead of reading a locale
    const showDeleteModal = () => {
        const triggerNode = trigger();
        const list = triggerNode?.closest<HTMLElement>(`.${prefix}-list`);
        Modal.warning({
            title: locale().locale.deleteConfirm,
            content: locale().locale.deleteContent,
            onOk: () => foundation.deleteMessage(),
            // the deleted message took the more button along; the list takes the focus the modal gives up
            afterClose: () => triggerNode && handoverFocus(triggerNode, list),
        });
        foundation.hideMoreDropdown();
    };

    const copyNode = () => <Button type="tertiary" class={`${PREFIX_ACTION}-btn`} aria-label={locale().locale.copy} theme="borderless" icon={<IconCopyStroked />} onClick={() => foundation.copyMessage()} />;

    const resetNode = () => <Button type="tertiary" class={`${PREFIX_ACTION}-btn`} aria-label={locale().locale.regenerate} theme="borderless" icon={<IconRedoStroked class={`${PREFIX_ACTION}-icon-redo`} />} onClick={() => foundation.resetMessage()} />;

    const likeNode = () => <Button type="tertiary" class={`${PREFIX_ACTION}-btn`} aria-label={locale().locale.like} aria-pressed={Boolean(props.message.like)} theme="borderless" icon={props.message.like ? <IconLikeThumb /> : <IconThumbUpStroked />} onClick={() => foundation.likeMessage()} />;

    const dislikeNode = () => (
        <Button
            type="tertiary"
            class={`${PREFIX_ACTION}-btn`}
            aria-label={locale().locale.dislike}
            aria-pressed={Boolean(props.message.dislike)}
            theme="borderless"
            icon={props.message.dislike ? <IconLikeThumb class={`${PREFIX_ACTION}-icon-flip`} /> : <IconThumbUpStroked class={`${PREFIX_ACTION}-icon-flip`} />}
            onClick={() => foundation.dislikeMessage()}
        />
    );

    const shareNode = () => <Button type="tertiary" class={`${PREFIX_ACTION}-btn`} aria-label={locale().locale.share} theme="borderless" icon={<IconShareStroked />} onClick={() => foundation.shareMessage()} />;

    const editNode = () => <Button type="tertiary" class={`${PREFIX_ACTION}-btn`} aria-label={locale().locale.edit} theme="borderless" icon={<IconEditStroked />} onClick={() => foundation.editMessage()} />;

    const moreNode = () => (
        <Dropdown
            class={`${PREFIX_ACTION}-dropdown`}
            position="bottomLeft"
            render={
                <Dropdown.Menu onMouseDown={markPressInside}>
                    <Dropdown.Item onClick={showDeleteModal}>
                        <IconDeleteStroked /> {locale().locale.delete}
                    </Dropdown.Item>
                </Dropdown.Menu>
            }
            spacing={12}
            stopPropagation
            trigger="custom"
            visible={state().visible}
            onEscKeyDown={() => foundation.hideMoreDropdown()}
        >
            {(getTriggerProps) => <Button {...getTriggerProps({ ref: setTrigger })} type="tertiary" aria-label={locale().locale.more} theme="borderless" icon={<IconMoreStroked />} onClick={() => foundation.showMoreDropdown()} />}
        </Dropdown>
    );

    return (
        <Show
            when={context.view().dialogueRenderConfig?.renderDialogueAction}
            keyed
            fallback={
                <div class={wrapCls()}>
                    <Show when={completed()}>{copyNode()}</Show>
                    <Show when={showReset()}>{resetNode()}</Show>
                    <Show when={completed()}>{shareNode()}</Show>
                    <Show when={showEdit()}>{editNode()}</Show>
                    <Show when={showFeedback()}>
                        {likeNode()}
                        {dislikeNode()}
                    </Show>
                    {moreNode()}
                </div>
            }
        >
            {(render) => {
                const factories = { copyNode, likeNode, dislikeNode, resetNode, shareNode, editNode, moreNode };
                const keys = createMemo(
                    () => {
                        const shown: (keyof typeof factories)[] = [];
                        if (completed()) {
                            shown.push('copyNode');
                        }
                        if (showFeedback()) {
                            shown.push('likeNode', 'dislikeNode');
                        }
                        if (showReset()) {
                            shown.push('resetNode');
                        }
                        if (completed()) {
                            shown.push('shareNode');
                        }
                        if (showEdit()) {
                            shown.push('editNode');
                        }
                        shown.push('moreNode');
                        return shown;
                    },
                    [],
                    { equals: (a, b) => a.join() === b.join() }
                );
                // Render functions, so a button exists only where the custom bar calls one: a button created but left
                // out of the bar is never inserted, which shifts the hydration keys after it.
                return render({
                    get message() {
                        return props.message;
                    },
                    get defaultActions() {
                        return keys().map((key) => factories[key]);
                    },
                    get defaultActionsObj(): DefaultActionNodeObj {
                        return Object.fromEntries(keys().map((key) => [key, factories[key]]));
                    },
                    get class() {
                        return wrapCls();
                    },
                });
            }}
        </Show>
    );
}
