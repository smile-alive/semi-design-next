import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Direction, Enable, HandleClassName, ResizeCallback, ResizeStartCallback, Size } from '@fibrae/semi-foundation/resizable/types';

export type { Direction, Enable, HandleClassName, ResizeCallback, ResizeStartCallback, Size } from '@fibrae/semi-foundation/resizable/types';

export type HandleStyle = Partial<Record<Direction, string>>;

export interface ResizableHandleSnippetProps {
    direction: Direction;
}

export interface ResizableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** Controlled size, per axis: an axis left undefined follows the drag */
    size?: Size;
    /** Initial size, per axis; it is also the fallback of an axis `size` leaves undefined */
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
    handleWrapperStyle?: string;
    handleWrapperClass?: string;
    /** Returning `false` cancels the resize */
    onResizeStart?: ResizeStartCallback;
    onChange?: ResizeCallback;
    onResizeEnd?: ResizeCallback;
    children?: Snippet;
    /** Content of each enabled handle */
    handle?: Snippet<[ResizableHandleSnippetProps]>;
}

export interface ResizeGroupProps extends HTMLAttributes<HTMLDivElement> {
    direction?: 'horizontal' | 'vertical';
    children?: Snippet;
}

export interface ResizeItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    min?: string;
    max?: string;
    /** A percentage, px, vw or vh string, or a number (or numeric string) for a share of the remaining space */
    defaultSize?: string | number;
    /** Returning `false` from either item beside the handler cancels the resize */
    onResizeStart?: ResizeStartCallback;
    onChange?: ResizeCallback;
    onResizeEnd?: ResizeCallback;
    children?: Snippet;
}

export interface ResizeHandlerProps extends HTMLAttributes<HTMLDivElement> {
    /** Replaces the default grip icon */
    children?: Snippet;
}
