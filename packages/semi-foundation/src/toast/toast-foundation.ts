import AutoCloseFoundation, { type AutoCloseAdapter, type AutoCloseBaseProps } from '../base/auto-close-foundation';

export type ToastType = 'success' | 'warning' | 'error' | 'info' | 'default';
export type ToastTheme = 'light' | 'normal';
export type Directions = 'ltr' | 'rtl';

export interface ConfigProps {
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
    duration?: number;
    zIndex?: number;
    theme?: ToastTheme;
    getPopupContainer?: () => HTMLElement;
}
export interface ToastProps extends ConfigProps {
    onClose?: () => void;
    content: any;
    type?: ToastType;
    textMaxWidth?: string | number;
    style?: Record<string, any>;
    className?: string;
    showClose?: boolean;
    icon?: any;
    direction?: Directions;
    close?: (id: string) => void;
    // true stacks once more than numbers.stackThreshold toasts are shown; a number sets that threshold
    stack?: boolean | number;
}

export interface ToastInstance extends ToastProps {
    id?: string;
    motion?: boolean;
}

export interface ToastState {}

export type ToastBaseProps = AutoCloseBaseProps;
export type ToastBaseState = ToastState;

export type ToastAdapter<P extends ToastBaseProps = ToastBaseProps, S extends ToastBaseState = ToastBaseState> = AutoCloseAdapter<P, S>;

/** Auto close shared with Notification's Notice */
export default class ToastFoundation<P extends ToastBaseProps = ToastBaseProps, S extends ToastBaseState = ToastBaseState> extends AutoCloseFoundation<P, S> {}
