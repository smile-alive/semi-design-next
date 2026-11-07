import type { DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import ActionBarFoundation, { type ActionBarState } from '../../base/action-bar-foundation';
import type { Message } from './foundation';

export interface ChatBoxActionBaseProps {
    message?: Message;
}

/** The text copied for a message: its string content, or its joined text parts; undefined when empty */
export function getMessageText(message?: Message): string | undefined {
    const content = message?.content;
    const text = Array.isArray(content) ? content.map((item) => item.text ?? '').join('') : content;
    return typeof text === 'string' && text !== '' ? text : undefined;
}

export type ChatBoxActionState = ActionBarState;

export interface ChatBoxActionAdapter<P extends ChatBoxActionBaseProps = ChatBoxActionBaseProps> extends DefaultAdapter<P, ChatBoxActionState> {
    notifyDeleteMessage: () => void;
    notifyMessageCopy: () => void;
    toastCopySuccess: () => void;
    notifyLikeMessage: () => void;
    notifyDislikeMessage: () => void;
    notifyResetMessage: () => void;
}

export default class ChatBoxActionFoundation<P extends ChatBoxActionBaseProps = ChatBoxActionBaseProps> extends ActionBarFoundation<ChatBoxActionAdapter<P>, P, ChatBoxActionState> {
    static getInitialState(): ChatBoxActionState {
        return { visible: false, showAction: false };
    }

    showDeletePopup = () => {
        this.openMenu();
    };

    /** Closes the delete popConfirm: from its buttons, or on a mousedown outside its trigger while it is open */
    hideDeletePopup = () => {
        this.closeMenu();
    };

    deleteMessage = () => {
        this.adapter.notifyDeleteMessage();
    };

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

    likeMessage = () => {
        this.adapter.notifyLikeMessage();
    };

    dislikeMessage = () => {
        this.adapter.notifyDislikeMessage();
    };

    resetMessage = () => {
        this.adapter.notifyResetMessage();
    };
}
