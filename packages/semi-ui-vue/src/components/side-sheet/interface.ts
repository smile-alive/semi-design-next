import type { ClassValue, StyleValue, VNode } from 'vue';
import type { SideSheetPart } from '@fibrae/semi-foundation/components/side-sheet/constants';
import type { Placement } from '@fibrae/semi-foundation/components/side-sheet/side-sheet-foundation';

export interface SideSheetProps {
    /** Lets `width` apply to a top or bottom sheet, which otherwise spans the full width. */
    canVerticalSetWidth?: boolean;
    /** `content` is the role="dialog" element. Merged after the built-in class names of the part's element. */
    classNames?: Partial<Record<SideSheetPart, ClassValue>>;
    closable?: boolean;
    closeOnEsc?: boolean;
    disableScroll?: boolean;
    getPopupContainer?: () => HTMLElement;
    height?: number | string;
    keepDOM?: boolean;
    mask?: boolean;
    maskClosable?: boolean;
    motion?: boolean;
    placement?: Placement;
    size?: 'small' | 'medium' | 'large';
    styles?: Partial<Record<SideSheetPart, StyleValue>>;
    /** Plain-text title; the `#title` slot wins when both are given. Declared so `title="x"` is not a native tooltip. */
    title?: string;
    visible?: boolean;
    width?: number | string;
    zIndex?: number;
}

export interface SideSheetEmits {
    /** Close button, mask click (native MouseEvent) and Escape (native KeyboardEvent); `update:visible` comes first. */
    cancel: [event: MouseEvent | KeyboardEvent];
    'update:visible': [visible: boolean];
    /** true once the enter animation ends; false once hidden, after the leave animation, or on unmount while shown. */
    afterVisibleChange: [visible: boolean];
}

export interface SideSheetSlots {
    default?: () => VNode[];
    title?: () => VNode[];
    footer?: () => VNode[];
    /** Empty content falls back to the default icon; `closable=false` removes the button. */
    closeIcon?: () => VNode[];
}

export interface SideSheetHandle {
    /** The outer `.semi-sidesheet` element inside the portal; null while nothing is rendered */
    readonly root: HTMLDivElement | null;
}
