import { omitBy } from 'es-toolkit';
import ListStore, { type ListStoreState } from '../base/list-store';
import type { NoticeInstance, NoticePosition } from '../notification/notification-foundation';
import { createId } from '../utils/uuid';

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

export const noticePositions = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight'] as const satisfies readonly NoticePosition[];

export type NoticesInPosition<T extends NoticeInstance = NoticeInstance> = Record<NoticePosition, T[]>;

/**
 * The notices of a snapshot per position, in display order with the leaving ones in their place. A notice naming no
 * position goes to the corner its direction (its own, else the list's) starts from. The notices must carry the global
 * default position already: `open` merges it.
 */
export function groupNoticesByPosition<T extends NoticeInstance>({ notices, removedItems, order }: { notices: T[]; removedItems: T[]; order: string[] }, direction?: 'ltr' | 'rtl') {
    const byId = new Map([...notices, ...removedItems].map((notice) => [notice.id, notice]));
    const grouped = Object.fromEntries(noticePositions.map((position) => [position, []])) as unknown as NoticesInPosition<T>;
    for (const id of order) {
        const notice = byId.get(id);
        if (notice) {
            const defaultPosition = (notice.direction || direction) === 'rtl' ? 'topLeft' : 'topRight';
            grouped[notice.position || defaultPosition].push(notice);
        }
    }
    return grouped;
}

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

    add = (notice: NoticeInstance) => {
        this.#items.add(notice);
    };

    /**
     * Shows a notice with `opts` over the list's defaults and the global defaults, which is where the global defaults
     * take effect (position, offsets and stack included): an explicit undefined replaces nothing. `beforeShow` gets the
     * merged options before the notice is added, so a static API can place its wrapper by them. Returns the id.
     */
    open = (opts: NoticeInstance, globalDefaults: Partial<NoticeInstance>, beforeShow?: (merged: NoticeInstance) => void) => {
        const merged: NoticeInstance = { ...this.defaults, ...globalDefaults, ...omitBy(opts, (value) => value === undefined) };
        const id = merged.id ?? createId('notification');
        beforeShow?.(merged);
        this.add({ ...merged, id });
        return id;
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
