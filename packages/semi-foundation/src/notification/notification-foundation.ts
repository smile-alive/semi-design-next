import AutoCloseFoundation, { type AutoCloseAdapter, type AutoCloseBaseProps } from '../base/auto-close-foundation';
import type { strings } from '../notification/constants';

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

export type NoticeAdapter<P extends NoticeBaseProps = NoticeBaseProps, S extends NoticeBaseState = NoticeBaseState> = AutoCloseAdapter<P, S>;

/** Auto close shared with Toast */
export default class NotificationFoundation<P extends NoticeBaseProps = NoticeBaseProps, S extends NoticeBaseState = NoticeBaseState> extends AutoCloseFoundation<P, S> {}
