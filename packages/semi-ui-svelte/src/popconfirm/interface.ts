import type { Snippet } from 'svelte';
import type { ButtonProps, Type as ButtonType } from '../button/interface.js';
import type { PopoverProps } from '../popover/index.js';
import type { RenderContentProps } from '../tooltip/index.js';

export type { ButtonType };

/** Props for a footer button; `autoFocus` only selects the initially focused button, `onclick` runs before the built-in one */
export interface PopconfirmButtonProps extends ButtonProps {
    autoFocus?: boolean;
}

// class and style land on the `.semi-popconfirm` card, not on the popup
export interface PopconfirmProps extends Omit<PopoverProps, 'content'> {
    cancelButtonProps?: PopconfirmButtonProps;
    cancelText?: string;
    cancelType?: ButtonType;
    disabled?: boolean;
    okButtonProps?: PopconfirmButtonProps;
    okText?: string;
    okType?: ButtonType;
    showCloseIcon?: boolean;
    /** Names the dialog; a string or a snippet */
    title?: string | Snippet;
    content?: Snippet<[RenderContentProps]>;
    /** Replaces the warning icon; `null` shows no icon */
    icon?: Snippet | null;
    /** Receives the button's native click event; a returned Promise keeps the button loading until it settles */
    onCancel?: (event: MouseEvent) => Promise<unknown> | void;
    onConfirm?: (event: MouseEvent) => Promise<unknown> | void;
}

export interface PopconfirmState {
    visible: boolean;
    cancelLoading: boolean;
    confirmLoading: boolean;
}
