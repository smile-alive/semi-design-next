import type { HTMLAttributes, VNode } from 'vue';
import type { ButtonProps, Type as ButtonType } from '../button/interface';
import type { PopoverEmits, PopoverProps } from '../popover/interface';
import type { RenderContentProps } from '../tooltip/interface';

export type { ButtonType };

/** Props and listeners for a footer button; `autoFocus` only selects the initially focused button. */
export interface PopconfirmButtonProps extends ButtonProps {
    autoFocus?: boolean;
    class?: HTMLAttributes['class'];
    style?: HTMLAttributes['style'];
    onClick?: (event: MouseEvent) => void;
}

export interface PopconfirmProps extends PopoverProps {
    cancelButtonProps?: PopconfirmButtonProps;
    cancelText?: string;
    cancelType?: ButtonType;
    defaultVisible?: boolean;
    disabled?: boolean;
    okButtonProps?: PopconfirmButtonProps;
    okText?: string;
    okType?: ButtonType;
    showCloseIcon?: boolean;
    /** Plain-text title; the `#title` slot wins when both are given. Declared so `title="x"` is not a native tooltip. */
    title?: string;
    /** Receives the button's native click event; a returned Promise keeps the button loading until it settles. */
    onCancel?: (event: MouseEvent) => Promise<unknown> | void;
    onConfirm?: (event: MouseEvent) => Promise<unknown> | void;
}

export interface PopconfirmSlots {
    default?: () => VNode[];
    title?: () => VNode[];
    content?: (props: RenderContentProps) => VNode[];
    icon?: () => VNode[];
}

export interface PopconfirmEmits extends PopoverEmits {}

export interface PopconfirmHandle {
    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    focusTrigger: () => void;
}

export interface PopconfirmState {
    visible: boolean;
    cancelLoading: boolean;
    confirmLoading: boolean;
}
