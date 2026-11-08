import BaseFoundation, { type DefaultAdapter } from './foundation';

export interface AutoCloseBaseProps {
    id?: string;
    // seconds; 0 or unset never closes on its own
    duration?: number;
}

export interface AutoCloseAdapter<P extends AutoCloseBaseProps = AutoCloseBaseProps, S = Record<string, never>> extends DefaultAdapter<P, S> {
    notifyWrapperToRemove: (id: string) => void;
    notifyClose: () => void;
}

/** What a Toast or Notification list tells each of its items; every field keeps its identity until it changes */
export interface AutoCloseListState {
    /** The pointer or focus is inside the list: every countdown waits */
    paused: boolean;
    /** Omitted by a host that unmounts a removed item at once, which leaves no countdown to stop */
    removedItems?: readonly { id?: string }[];
    updatedItems: readonly { id?: string }[];
}

/** Closes a toast or notice after `duration`; the list pauses the countdown on hover and restarts it after */
export default class AutoCloseFoundation<P extends AutoCloseBaseProps = AutoCloseBaseProps, S = Record<string, never>, A extends AutoCloseAdapter<P, S> = AutoCloseAdapter<P, S>> extends BaseFoundation<A, P, S> {
    #timer: ReturnType<typeof setTimeout> | null = null;
    #id: string | null = null;
    // an update while hovered must not start the countdown the hover paused; also holds a pause that arrived before init()
    #paused = false;
    // removed from outside: hover/focus ending during the leave animation must not restart the countdown
    #leaving = false;
    #list: AutoCloseListState | undefined;

    #includesThis(items: readonly { id?: string }[]) {
        const id = this.getProp('id');
        return items.some((item) => item.id === id);
    }

    override init() {
        this.startCloseTimer();
        this.#id = this.getProp('id');
    }

    override destroy() {
        this.clearCloseTimer();
    }

    isLeaving = () => this.#leaving;

    leave = () => {
        this.#leaving = true;
        this.clearCloseTimer();
    };

    pauseCloseTimer = () => {
        this.#paused = true;
        this.clearCloseTimer();
    };

    resumeCloseTimer = () => {
        this.#paused = false;
        this.startCloseTimer();
    };

    /**
     * Follows the list: pauses while it is hovered or focused, stops when the store removed this item from outside (the
     * countdown must not call onClose during the leave), and restarts when the store updated it in place. The first call
     * only applies the state the item mounted into; hosts may call it before or after init(). Returns whether this call
     * saw this item updated, so the host can follow up (announce it).
     */
    handleListChange = (list: AutoCloseListState) => {
        const prev = this.#list;
        this.#list = list;
        if (list.paused !== (prev?.paused ?? false)) {
            if (list.paused) {
                this.pauseCloseTimer();
            } else {
                this.resumeCloseTimer();
            }
        }
        if (list.removedItems && list.removedItems !== prev?.removedItems && this.#includesThis(list.removedItems)) {
            this.leave();
        }
        if (prev && list.updatedItems !== prev.updatedItems && this.#includesThis(list.updatedItems)) {
            this.restartCloseTimer();
            return true;
        }
        return false;
    };

    startCloseTimer() {
        this.clearCloseTimer();
        const duration = this.getProp('duration');
        if (!this.#leaving && !this.#paused && duration && typeof duration === 'number') {
            this.#timer = setTimeout(() => {
                this.close();
            }, duration * 1000);
        }
    }

    close = (e?: { stopPropagation: () => void }) => {
        e?.stopPropagation();
        // the item stays mounted until its leave animation ends, and a second click or Enter must not report again
        if (this.#leaving) {
            return;
        }
        this.#leaving = true;
        this.clearCloseTimer();
        this.adapter.notifyWrapperToRemove(this.#id);
        this.adapter.notifyClose();
    };

    clearCloseTimer() {
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }

    restartCloseTimer = () => {
        this.#leaving = false;
        this.startCloseTimer();
    };
}
