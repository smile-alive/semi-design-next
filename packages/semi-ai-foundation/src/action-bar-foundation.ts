import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { ResetTimer } from '@fibrae/semi-foundation/base/reset-timer';

// keeps the action bar from flickering while the menu's close transition runs
const HIDE_ACTION_DELAY = 150;

export interface ActionBarState {
    /** Whether the menu (Chat's delete confirmation, AIChatDialogue's more menu) is open */
    visible: boolean;
    /** Whether the action bar stays shown without hover */
    showAction: boolean;
}

/** The action bar of a message in Chat and AIChatDialogue: stays shown while its menu is open and briefly after */
export default class ActionBarFoundation<A extends DefaultAdapter<P, S>, P, S extends ActionBarState> extends BaseFoundation<A, P, S> {
    #hideTimer = new ResetTimer();

    protected openMenu() {
        this.#hideTimer.clear();
        this.setState({ visible: true, showAction: true } as Pick<S, 'visible' | 'showAction'>);
    }

    protected closeMenu() {
        this.setState({ visible: false } as Pick<S, 'visible'>);
        this.#hideTimer.start(HIDE_ACTION_DELAY, () => this.setState({ showAction: false } as Pick<S, 'showAction'>));
    }

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
