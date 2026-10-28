import type { CSSProperties, VNode } from 'vue';
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
    contentClassName?: string | unknown[];
    showArrow?: boolean;
    spacing?: number | { x: number; y: number };
    stopPropagation?: boolean | string;
    arrowStyle?: ArrowStyle;
    arrowPointAtCenter?: boolean;
    prefixCls?: string;
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
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}
