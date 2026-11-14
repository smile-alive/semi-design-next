import type { ClassValue, ShallowRef, StyleValue, VNode } from 'vue';
import type { strings, TooltipPart } from '@fibrae/semi-foundation/components/tooltip/constants';
import type { Position, TooltipBaseProps } from '@fibrae/semi-foundation/components/tooltip/foundation';

export type { Position } from '@fibrae/semi-foundation/components/tooltip/foundation';
export type Trigger = (typeof strings.TRIGGER_SET)[number];

export interface TooltipProps extends TooltipBaseProps {
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    spacing?: number | { x: number; y: number };
    showArrow?: boolean;
    role?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    arrowPointAtCenter?: boolean;
    wrapWhenSpecial?: boolean;
    stopPropagation?: boolean;
    /** `wrapper` exists only when the trigger is wrapped: text, several nodes, or a disabled or loading trigger */
    classNames?: Partial<Record<TooltipPart, ClassValue>>;
    styles?: Partial<Record<TooltipPart, StyleValue>>;
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
    /** The popup element, null while it is not in the document */
    getPopup: () => HTMLElement | null;
    hide: () => void;
    rePosition: () => void;
}
