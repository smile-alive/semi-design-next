import ListStore, { type ListStoreState } from '../base/list-store';
import type { NoticeInstance, NoticePosition } from '../notification/notification-foundation';

export interface NotificationListState extends ListStoreState<NoticeInstance> {
    notices: NoticeInstance[];
}

export interface NotificationListProps {
    store: NotificationListStore;
}

export interface ConfigProps {
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
    duration?: number;
    position?: NoticePosition;
    zIndex?: number;
    stack?: boolean | number;
}

const builtInDefaults: NoticeInstance & Pick<ConfigProps, 'top' | 'bottom' | 'left' | 'right'> = {
    duration: 3,
    // no position: the list falls back to topLeft or topRight by direction when a notice names none
    content: '',
    title: '',
    zIndex: 1010,
};

/** Notices of one list, newest first; `defaults` are the options of the static API that owns the list */
export default class NotificationListStore {
    #items = new ListStore<NoticeInstance, 'notices', NotificationListState>('notices', 'start', {
        notices: [],
        removedItems: [],
        updatedItems: [],
        order: [],
    });

    defaults = { ...builtInDefaults };

    subscribe = (listener: () => void) => this.#items.subscribe(listener);

    getSnapshot = () => this.#items.getSnapshot();

    /** Shows a notice, or updates the shown one with the same id */
    add = (notice: NoticeInstance) => {
        this.#items.add(notice);
    };

    remove = (id: string) => {
        this.#items.remove(id);
    };

    finishLeave = (id: string) => {
        this.#items.finishLeave(id);
    };

    clear = () => {
        this.#items.clear();
    };

    config = (opts: ConfigProps) => {
        for (const pos of ['top', 'left', 'bottom', 'right'] as const) {
            if (pos in opts) {
                this.defaults[pos] = opts[pos];
            }
        }
        if (typeof opts.zIndex === 'number') {
            this.defaults.zIndex = opts.zIndex;
        }
        if (typeof opts.duration === 'number') {
            this.defaults.duration = opts.duration;
        }
        if (typeof opts.position === 'string') {
            this.defaults.position = opts.position;
        }
        if ('stack' in opts) {
            this.defaults.stack = opts.stack;
        }
    };

    resetConfig = () => {
        this.defaults = { ...builtInDefaults };
    };
}
