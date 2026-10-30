import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Placement } from '@fibrae/semi-foundation/side-sheet/side-sheet-foundation';

/**
 * `aria-*` and `style` land on the `role="dialog"` element, `class` and the other attributes on the outer
 * `.semi-sidesheet` element.
 */
export interface SideSheetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style' | 'title'> {
    /** true once shown; false once hidden, after the leave animation, or on unmount while shown */
    afterVisibleChange?: (isVisible: boolean) => void;
    bodyStyle?: string;
    /** Lets `width` apply to a top or bottom sheet, which otherwise spans the full width. */
    canVerticalSetWidth?: boolean;
    closable?: boolean;
    closeOnEsc?: boolean;
    disableScroll?: boolean;
    getPopupContainer?: () => HTMLElement;
    headerStyle?: string;
    height?: number | string;
    keepDOM?: boolean;
    mask?: boolean;
    maskClosable?: boolean;
    maskStyle?: string;
    motion?: boolean;
    /** Close button, mask click and Escape (native KeyboardEvent); `visible` is written back to false first. */
    onCancel?: (event: MouseEvent | KeyboardEvent) => void;
    placement?: Placement;
    size?: 'small' | 'medium' | 'large';
    style?: string;
    /** A string is the plain-text title, so `title="x"` does not become a native tooltip on the outer element. */
    title?: Snippet | string;
    visible?: boolean;
    width?: number | string;
    zIndex?: number;
    children?: Snippet;
    footer?: Snippet;
    /** Replaces the default icon; `closable={false}` removes the button. */
    closeIcon?: Snippet;
}
