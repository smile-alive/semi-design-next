import type { CSSProperties, ClassValue, StyleValue, VNode } from 'vue';
import type { PopoverPart } from '@fibrae/semi-foundation/components/popover/constants';
import type { Position, RenderContentProps, TooltipEmits, TooltipProps } from '../tooltip/interface';

export interface ArrowStyle {
    borderColor?: string;
    backgroundColor?: string;
    borderOpacity?: string | number;
}

export interface ArrowProps {
    position?: string;
    arrowStyle?: ArrowStyle;
    popStyle?: CSSProperties;
}

export interface PopoverProps {
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    role?: string;
    autoAdjustOverflow?: boolean;
    visible?: boolean;
    position?: Position;
    motion?: boolean;
    mouseEnterDelay?: number;
    mouseLeaveDelay?: number;
    trigger?: TooltipProps['trigger'];
    classNames?: Partial<Record<PopoverPart, ClassValue>>;
    showArrow?: boolean;
    spacing?: number | { x: number; y: number };
    stopPropagation?: boolean | string;
    styles?: { content?: StyleValue; arrow?: ArrowStyle };
    arrowPointAtCenter?: boolean;
    closeOnEsc?: boolean;
    guardFocus?: boolean;
    returnFocusOnClose?: boolean;
    clickToHide?: boolean;
    disableArrowKeyDown?: boolean;
    disableFocusListener?: boolean;
    keepDOM?: boolean;
    condition?: boolean;
}

export interface PopoverSlots {
    default?: () => VNode[];
    content?: (props: RenderContentProps) => VNode[];
}

export interface PopoverEmits extends TooltipEmits {}

export interface PopoverHandle {
    focusTrigger: () => void;
    /** The popup element, null while it is not in the document */
    getPopup: () => HTMLElement | null;
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}
