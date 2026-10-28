import type { StyleValue, VNode } from 'vue';
import type { Direction, Enable, HandleClassName, ResizeStartCallback, Size } from '@fibrae/semi-foundation/resizable/types';

export type { Direction, Enable, HandleClassName, ResizeCallback, ResizeStartCallback, Size } from '@fibrae/semi-foundation/resizable/types';

export type HandleStyle = Partial<Record<Direction, StyleValue>>;

type ResizeEvent = [size: Size, event: PointerEvent | KeyboardEvent, direction: Direction];

export interface ResizableProps {
    /** Controlled size, per axis: an axis left undefined follows the drag */
    size?: Size;
    defaultSize?: Size;
    /** `false` renders no handles; a direction missing from the object is enabled */
    enable?: Enable | false;
    grid?: [number, number];
    snap?: { x?: number[]; y?: number[] };
    snapGap?: number;
    boundElement?: 'parent' | 'window' | HTMLElement;
    boundsByDirection?: boolean;
    minWidth?: string | number;
    minHeight?: string | number;
    maxWidth?: string | number;
    maxHeight?: string | number;
    lockAspectRatio?: boolean | number;
    lockAspectRatioExtraWidth?: number;
    lockAspectRatioExtraHeight?: number;
    scale?: number;
    ratio?: number | [number, number];
    handleStyle?: HandleStyle;
    handleClass?: HandleClassName;
    handleWrapperStyle?: StyleValue;
    handleWrapperClass?: string;
    /** Returning `false` cancels the resize */
    onResizeStart?: ResizeStartCallback;
}

export interface ResizableEmits {
    'update:size': [size: Size];
    change: ResizeEvent;
    resizeEnd: ResizeEvent;
}

export interface ResizableHandleSlotProps {
    direction: Direction;
}

export interface ResizableSlots {
    default?: () => VNode[];
    /** Content of each enabled handle */
    handle?: (props: ResizableHandleSlotProps) => VNode[];
}

export interface ResizeGroupProps {
    direction?: 'horizontal' | 'vertical';
}

export interface ResizeGroupSlots {
    default?: () => VNode[];
}

export interface ResizeItemProps {
    min?: string;
    max?: string;
    /** A percentage, px, vw or vh string, or a number (or numeric string) for a share of the remaining space */
    defaultSize?: string | number;
    /** Returning `false` from either item beside the handler cancels the resize */
    onResizeStart?: ResizeStartCallback;
}

export interface ResizeItemEmits {
    change: ResizeEvent;
    resizeEnd: ResizeEvent;
}

export interface ResizeItemSlots {
    default?: () => VNode[];
}

export interface ResizeHandlerSlots {
    /** Replaces the default grip icon */
    default?: () => VNode[];
}
