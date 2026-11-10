import type { ComputedRef } from 'vue';
import type { AutoCloseListState } from '@fibrae/semi-foundation/base';
import type { NoticeInstance } from '@fibrae/semi-foundation/components/notification/notification-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { createContext } from '../../base/index';

/** A notice as the store holds it: `open` always gives an id, and the offsets ride along from the options */
export type ListedNotice = NoticeInstance & Required<Pick<NoticeInstance, 'id'>> & Pick<ConfigProps, 'top' | 'bottom' | 'left' | 'right'>;

/** Gives the list the notice element it reads when it announces the notice; returns the unregister */
export type RegisterNotice = (id: string, element: Element) => () => void;

export interface NoticeListContext {
    /** What every notice's countdown in the position's list follows */
    state: ComputedRef<AutoCloseListState>;
    register: RegisterNotice;
}

export const [provideNoticeListContext, useNoticeListContext] = createContext<NoticeListContext>('NoticeList', { optional: true });
