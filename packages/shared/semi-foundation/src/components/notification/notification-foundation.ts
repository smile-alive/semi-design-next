import { AutoCloseFoundation, type AutoCloseAdapter, type AutoCloseBaseProps } from '../../base/index';
import type { strings } from './constants';

export type NoticePosition = 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export type NoticeType = 'warning' | 'success' | 'info' | 'error' | 'default';
export type NoticeTheme = 'light' | 'normal';

export interface NoticeProps {
    duration?: number;
    id?: string;
    title?: any;
    content?: any;
    position?: NoticePosition;
    type?: NoticeType;
    onClick?: (e: any) => void;
    onClose?: () => void;
    onCloseClick?: (id: string) => void;
    showClose?: boolean;
    close?: (id: string) => void;
    zIndex?: number;
    icon?: any;
    getPopupContainer?: () => HTMLElement;
    theme?: NoticeTheme;
    direction?: (typeof strings.directions)[number];
    className?: string;
    style?: any;
    stack?: boolean | number;
}

export interface NoticeState {}

export type NoticeInstance = NoticeProps;

export type NoticeBaseProps = AutoCloseBaseProps;
export type NoticeBaseState = NoticeState;

export interface NoticeAdapter<P extends NoticeBaseProps = NoticeBaseProps, S extends NoticeBaseState = NoticeBaseState> extends AutoCloseAdapter<P, S> {
    /** The click on the close button, reported ahead of the close itself */
    notifyCloseClick: (id: string) => void;
}

/** Auto close shared with Toast, plus the close button's own report */
export default class NotificationFoundation<P extends NoticeBaseProps = NoticeBaseProps, S extends NoticeBaseState = NoticeBaseState> extends AutoCloseFoundation<P, S, NoticeAdapter<P, S>> {
    clickClose = (e: { stopPropagation: () => void }) => {
        // the click must not reach the notice's own handler, also when it is ignored
        e.stopPropagation();
        if (this.isLeaving()) {
            return;
        }
        this.adapter.notifyCloseClick(this.getProp('id'));
        this.close();
    };
}
