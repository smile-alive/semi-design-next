import type { ShallowRef, VNode } from 'vue';
import type { strings } from '@fibrae/semi-foundation/tooltip/constants';
import type { Position, TooltipBaseProps } from '@fibrae/semi-foundation/tooltip/foundation';

export type { Position } from '@fibrae/semi-foundation/tooltip/foundation';
export type Trigger = (typeof strings.TRIGGER_SET)[number];

export interface TooltipProps extends TooltipBaseProps {
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    prefixCls?: string;
    spacing?: number | { x: number; y: number };
    showArrow?: boolean;
    role?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    arrowPointAtCenter?: boolean;
    wrapWhenSpecial?: boolean;
    stopPropagation?: boolean;
    wrapperClassName?: string;
    wrapperId?: string;
    keepDOM?: boolean;
}

export interface FocusTarget {
    focus: (options?: FocusOptions) => void;
}

export interface RenderContentProps<T extends FocusTarget = FocusTarget> {
    initialFocusRef: ShallowRef<T | null>;
}

export interface TooltipSlots {
    default?: () => VNode[];
    content?: (props: RenderContentProps) => VNode[];
    arrow?: () => VNode[];
}

export interface TooltipEmits {
    'update:visible': [visible: boolean];
    visibleChange: [visible: boolean];
    clickOutSide: [event: MouseEvent];
    escKeyDown: [event: KeyboardEvent];
    /** Once per opening when the popup is shown, as its enter transition starts */
    open: [];
    /** Once per opening after the enter transition, not for an opening closed before it finishes */
    afterOpen: [];
    afterClose: [];
}

export interface TooltipHandle {
    focusTrigger: () => void;
    getPopupId: () => string;
    hide: () => void;
    rePosition: () => void;
}
