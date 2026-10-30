import type { ClassValue } from 'svelte/elements';
import type { TooltipProps } from '../tooltip/index.js';

export interface ArrowStyle {
    borderColor?: string;
    backgroundColor?: string;
    borderOpacity?: string | number;
}

export interface ArrowProps {
    position?: string;
    arrowStyle?: ArrowStyle;
    /** The popup's style string; its `background-color` and `border-color` color the arrow without an arrowStyle */
    popStyle?: string;
}

// No element props: Popover has no root DOM, so undeclared props are dropped (F11)
export interface PopoverProps {
    /** Names the popup when it is a dialog (click, contextMenu or custom trigger) */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    /**
     * Role of the popup; dialog with a click, contextMenu or custom trigger, tooltip otherwise.
     * A combobox passes presentation because it points at the inner listbox itself
     */
    role?: string;
    /** On the popup */
    class?: string;
    /** On the popup; its `background-color` and `border-color` also color the arrow */
    style?: string;
    autoAdjustOverflow?: boolean;
    /** Wrapped in Tooltip's span, which takes the trigger attributes */
    children?: TooltipProps['children'];
    /** Renders the trigger element itself, which takes `props`; wins over children */
    child?: TooltipProps['child'];
    content?: TooltipProps['content'];
    visible?: boolean;
    position?: TooltipProps['position'];
    motion?: boolean;
    mouseEnterDelay?: number;
    mouseLeaveDelay?: number;
    trigger?: TooltipProps['trigger'];
    contentClassName?: ClassValue;
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
    // Select and AIChatInput handle the arrow keys themselves
    disableArrowKeyDown?: boolean;
    disableFocusListener?: boolean;
    keepDOM?: boolean;
    /**
     * Whether the popover may show; false blocks it
     * @default true
     */
    condition?: boolean;
    onVisibleChange?: TooltipProps['onVisibleChange'];
    onClickOutSide?: TooltipProps['onClickOutSide'];
    onEscKeyDown?: TooltipProps['onEscKeyDown'];
    onOpen?: TooltipProps['onOpen'];
    afterOpen?: TooltipProps['afterOpen'];
    afterClose?: TooltipProps['afterClose'];
}
