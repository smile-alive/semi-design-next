import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import type { Message } from './foundation';

/** The props the foundation reads with getProps */
export interface ChatBoxActionBaseProps {
    message?: Message;
}

/** The text copied for a message: its string content, or its joined text parts; undefined when empty */
export function getMessageText(message?: Message): string | undefined {
    const content = message?.content;
    const text = Array.isArray(content) ? content.map((item) => item.text ?? '').join('') : content;
    return typeof text === 'string' && text !== '' ? text : undefined;
}

export interface ChatBoxActionAdapter<P extends ChatBoxActionBaseProps = ChatBoxActionBaseProps, S extends object = object> extends DefaultAdapter<P, S> {
    notifyDeleteMessage: () => void;
    notifyMessageCopy: () => void;
    toastCopySuccess: () => void;
    notifyLikeMessage: () => void;
    notifyDislikeMessage: () => void;
    notifyResetMessage: () => void;
    setVisible: (visible: boolean) => void;
    setShowAction: (showAction: boolean) => void;
}

export default class ChatBoxActionFoundation<P extends ChatBoxActionBaseProps = ChatBoxActionBaseProps, S extends object = object> extends BaseFoundation<ChatBoxActionAdapter<P, S>, P, S> {
    showDeletePopup = () => {
        this._adapter.setVisible(true);
        this._adapter.setShowAction(true);
    };

    /** Closes the delete popConfirm: from its buttons, or on a mousedown outside its trigger while it is open */
    hideDeletePopup = () => {
        // The delay keeps the action bar from flickering when the popConfirm closes through its cancel button
        this._adapter.setVisible(false);
        setTimeout(() => {
            this._adapter.setShowAction(false);
        }, 150);
    };

    deleteMessage = () => {
        this._adapter.notifyDeleteMessage();
    };

    copyMessage = () => {
        const text = getMessageText(this.getProps().message);
        if (text === undefined) {
            return;
        }
        void copyText(text).then((copied) => {
            if (copied) {
                this._adapter.toastCopySuccess();
                this._adapter.notifyMessageCopy();
            }
        });
    };

    likeMessage = () => {
        this._adapter.notifyLikeMessage();
    };

    dislikeMessage = () => {
        this._adapter.notifyDislikeMessage();
    };

    resetMessage = () => {
        this._adapter.notifyResetMessage();
    };
}
