import type { ClassValue, StyleValue, VNode } from 'vue';
import type { BannerPart } from '@fibrae/semi-foundation/components/banner/constants';

export type BannerType = 'info' | 'danger' | 'warning' | 'success';

export interface BannerProps {
    bordered?: boolean;
    classNames?: Partial<Record<BannerPart, ClassValue>>;
    fullMode?: boolean;
    styles?: Partial<Record<BannerPart, StyleValue>>;
    /** Plain-text title; the `#title` slot wins when both are given. Declared so `title="x"` is not a native tooltip. */
    title?: string;
    type?: BannerType;
}

export interface BannerSlots {
    default?: () => VNode[];
    description?: () => VNode[];
    /** Replaces the icon of the type; an empty slot hides the icon */
    icon?: () => VNode[];
    /** Replaces the icon of the close button; an empty slot removes the button */
    closeIcon?: () => VNode[];
    title?: () => VNode[];
}

export interface BannerEmits {
    /** The close button's click event; the banner hides right after the listeners return */
    close: [event: MouseEvent];
}

export type { BannerState } from '@fibrae/semi-foundation/components/banner/foundation';
