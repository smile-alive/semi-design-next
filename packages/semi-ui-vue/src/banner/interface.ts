import type { VNode } from 'vue';

export type BannerType = 'info' | 'danger' | 'warning' | 'success';

export interface BannerProps {
    bordered?: boolean;
    fullMode?: boolean;
    /** Plain-text title; the `#title` slot wins when both are given. Declared so `title="x"` is not a native tooltip. */
    title?: string;
    type?: BannerType;
}

export interface BannerSlots {
    /** Content below the message, in the `-extra` area */
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

export interface BannerState {
    visible: boolean;
}
