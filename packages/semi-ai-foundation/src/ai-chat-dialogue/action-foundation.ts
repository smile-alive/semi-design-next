import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import { isUnfinishedStatus, strings } from './constants';
import type { Message } from './foundation';
import { getMessageText } from './message-text';

const { ROLE, STATUS } = strings;

/**
 * Which action buttons a message shows. Every field is a boolean: callers memoize each flag by value, and an undefined
 * that later turns false would rebuild the buttons a custom action bar received.
 */
export function getDialogueActionFlags({ role, status = STATUS.COMPLETED, isLastChat, showReset }: { role?: string; status?: string; isLastChat?: boolean; showReset?: boolean }) {
    const completed = status === STATUS.COMPLETED;
    return {
        completed,
        finished: !isUnfinishedStatus(status),
        showFeedback: role !== ROLE.USER && completed,
        showReset: Boolean(showReset && isLastChat && role === ROLE.ASSISTANT),
        showEdit: role === ROLE.USER,
    };
}

/** The props the foundation reads with getProps */
export interface DialogueActionBaseProps {
    message?: Message;
}

export interface DialogueActionAdapter<P extends DialogueActionBaseProps = DialogueActionBaseProps, S extends object = object> extends DefaultAdapter<P, S> {
    notifyDeleteMessage: () => void;
    notifyMessageCopy: () => void;
    toastCopySuccess: () => void;
    notifyLikeMessage: () => void;
    notifyDislikeMessage: () => void;
    notifyResetMessage: () => void;
    notifyShareMessage: () => void;
    notifyEditMessage: () => void;
    setVisible: (visible: boolean) => void;
    setShowAction: (showAction: boolean) => void;
}

export default class DialogueActionFoundation<P extends DialogueActionBaseProps = DialogueActionBaseProps, S extends object = object> extends BaseFoundation<DialogueActionAdapter<P, S>, P, S> {
    copyMessage = () => {
        const text = getMessageText(this.getProps().message);
        if (text === undefined) {
            return;
        }
        void copyText(text).then((copied) => {
            if (copied) {
                this.adapter.toastCopySuccess();
                this.adapter.notifyMessageCopy();
            }
        });
    };

    resetMessage = () => {
        this.adapter.notifyResetMessage();
    };

    likeMessage = () => {
        this.adapter.notifyLikeMessage();
    };

    dislikeMessage = () => {
        this.adapter.notifyDislikeMessage();
    };

    shareMessage = () => {
        this.adapter.notifyShareMessage();
    };

    editMessage = () => {
        this.adapter.notifyEditMessage();
    };

    deleteMessage = () => {
        this.adapter.notifyDeleteMessage();
        this.hideMoreDropdown();
    };

    showMoreDropdown = () => {
        this.adapter.setVisible(true);
        this.adapter.setShowAction(true);
    };

    /** Closes the more menu: after a delete, or on a mousedown outside its trigger while it is open */
    hideMoreDropdown = () => {
        this.adapter.setVisible(false);
        setTimeout(() => {
            this.adapter.setShowAction(false);
        }, 150);
    };
}
