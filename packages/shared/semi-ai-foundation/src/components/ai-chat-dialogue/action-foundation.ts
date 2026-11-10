import ActionBarFoundation, { type ActionBarAdapter, type ActionBarState } from '../../base/action-bar-foundation';
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

export type DialogueActionKey = 'copyNode' | 'likeNode' | 'dislikeNode' | 'resetNode' | 'shareNode' | 'editNode' | 'moreNode';

// A custom bar's `defaultActions` keep the order Semi has always given them; the built-in bar lays the buttons out differently
const CUSTOM_ORDER: DialogueActionKey[] = ['copyNode', 'likeNode', 'dislikeNode', 'resetNode', 'shareNode', 'editNode', 'moreNode'];
const BAR_ORDER: DialogueActionKey[] = ['copyNode', 'resetNode', 'shareNode', 'editNode', 'likeNode', 'dislikeNode', 'moreNode'];

/** The buttons a message shows, in order: for a custom action bar (`defaultActions`) or for the built-in bar */
export function getDialogueActionKeys(flags: ReturnType<typeof getDialogueActionFlags>, custom: boolean) {
    const shown: Record<DialogueActionKey, boolean> = {
        copyNode: flags.completed,
        likeNode: flags.showFeedback,
        dislikeNode: flags.showFeedback,
        resetNode: flags.showReset,
        shareNode: flags.completed,
        editNode: flags.showEdit,
        moreNode: true,
    };
    return (custom ? CUSTOM_ORDER : BAR_ORDER).filter((key) => shown[key]);
}

export interface DialogueActionBaseProps {
    message?: Message;
}

export type DialogueActionState = ActionBarState;

export interface DialogueActionAdapter<P extends DialogueActionBaseProps = DialogueActionBaseProps> extends ActionBarAdapter<P, DialogueActionState> {
    notifyShareMessage: () => void;
    notifyEditMessage: () => void;
}

export default class DialogueActionFoundation<P extends DialogueActionBaseProps = DialogueActionBaseProps> extends ActionBarFoundation<DialogueActionAdapter<P>, P, DialogueActionState> {
    getCopyText() {
        return getMessageText(this.getProps().message);
    }

    shareMessage = () => {
        this.adapter.notifyShareMessage();
    };

    editMessage = () => {
        this.adapter.notifyEditMessage();
    };

    override deleteMessage = () => {
        this.adapter.notifyDeleteMessage();
        this.closeMenu();
    };
}
