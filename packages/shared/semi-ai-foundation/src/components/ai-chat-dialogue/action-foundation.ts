import type { DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import ActionBarFoundation, { type ActionBarState } from '../../base/action-bar-foundation';
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

export interface DialogueActionBaseProps {
    message?: Message;
}

export type DialogueActionState = ActionBarState;

export interface DialogueActionAdapter<P extends DialogueActionBaseProps = DialogueActionBaseProps> extends DefaultAdapter<P, DialogueActionState> {
    notifyDeleteMessage: () => void;
    notifyMessageCopy: () => void;
    toastCopySuccess: () => void;
    notifyLikeMessage: () => void;
    notifyDislikeMessage: () => void;
    notifyResetMessage: () => void;
    notifyShareMessage: () => void;
    notifyEditMessage: () => void;
}

export default class DialogueActionFoundation<P extends DialogueActionBaseProps = DialogueActionBaseProps> extends ActionBarFoundation<DialogueActionAdapter<P>, P, DialogueActionState> {
    static getInitialState(): DialogueActionState {
        return { visible: false, showAction: false };
    }

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
        this.openMenu();
    };

    /** Closes the more menu: after a delete, or on a mousedown outside its trigger while it is open */
    hideMoreDropdown = () => {
        this.closeMenu();
    };
}
