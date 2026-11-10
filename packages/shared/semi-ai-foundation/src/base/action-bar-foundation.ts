import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { ResetTimer } from '@fibrae/semi-foundation/base/reset-timer';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';

// keeps the action bar from flickering while the menu's close transition runs
const HIDE_ACTION_DELAY = 150;

export interface ActionBarState {
    /** Whether the menu (Chat's delete confirmation, AIChatDialogue's more menu) is open */
    visible: boolean;
    /** Whether the action bar stays shown without hover */
    showAction: boolean;
}

export interface ActionBarAdapter<P, S extends ActionBarState = ActionBarState> extends DefaultAdapter<P, S> {
    notifyDeleteMessage: () => void;
    notifyMessageCopy: () => void;
    toastCopySuccess: () => void;
    notifyLikeMessage: () => void;
    notifyDislikeMessage: () => void;
    notifyResetMessage: () => void;
}

/** The action bar of a message in Chat and AIChatDialogue: stays shown while its menu is open and briefly after */
export default abstract class ActionBarFoundation<A extends ActionBarAdapter<P, S>, P, S extends ActionBarState> extends BaseFoundation<A, P, S> {
    #hideTimer = new ResetTimer();

    static getInitialState(): ActionBarState {
        return { visible: false, showAction: false };
    }

    /** The bar shows without hover while a finished message offers reset, or while its menu is open or closing */
    static isActionBarShown({ showReset, finished, showAction }: { showReset: boolean; finished: boolean; showAction: boolean }) {
        return (showReset && finished) || showAction;
    }

    /** The text copied for the message; undefined when there is nothing to copy */
    abstract getCopyText(): string | undefined;

    openMenu = () => {
        this.#hideTimer.clear();
        this.setState({ visible: true, showAction: true } as Pick<S, 'visible' | 'showAction'>);
    };

    /** Closes the menu: from its buttons, or on a mousedown outside its trigger while it is open */
    closeMenu = () => {
        this.setState({ visible: false } as Pick<S, 'visible'>);
        this.#hideTimer.start(HIDE_ACTION_DELAY, () => this.setState({ showAction: false } as Pick<S, 'showAction'>));
    };

    copyMessage = () => {
        const text = this.getCopyText();
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

    deleteMessage = () => {
        this.adapter.notifyDeleteMessage();
    };

    override init() {
        this.#hideTimer.mount();
        // a hide that was pending when the component was hidden has nothing left to wait for
        const { visible, showAction } = this.getStates();
        if (!visible && showAction) {
            this.setState({ showAction: false } as Pick<S, 'showAction'>);
        }
    }

    override destroy() {
        this.#hideTimer.unmount();
    }
}
