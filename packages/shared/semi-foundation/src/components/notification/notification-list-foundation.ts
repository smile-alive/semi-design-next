import { ListStore, type ListStoreState } from '../../base/index';
import type { NoticeInstance, NoticePosition } from './notification-foundation';

/** A notice of the list: `open` gives every notice an id */
export type NoticeItem = NoticeInstance & { id: string };

export type NotificationListState = ListStoreState<NoticeItem>;

export interface NotificationListProps {
    store: ListStore<NoticeInstance>;
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

export const builtInDefaults: NoticeInstance & Pick<ConfigProps, 'top' | 'bottom' | 'left' | 'right'> = {
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
export function groupNoticesByPosition<T extends NoticeInstance>({ items, removedItems, order }: { items: T[]; removedItems: T[]; order: string[] }, direction?: 'ltr' | 'rtl') {
    const byId = new Map([...items, ...removedItems].map((notice) => [notice.id, notice]));
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

/** Notices of one list, newest first */
export function createNotificationListStore() {
    return new ListStore<NoticeInstance>('start', 'notification', { ...builtInDefaults });
}
