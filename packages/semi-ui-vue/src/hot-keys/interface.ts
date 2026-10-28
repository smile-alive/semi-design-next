import type { VNode } from 'vue';

export interface HotKeysProps {
    /** Keys that must be pressed together: any number of modifiers and exactly one other key */
    hotKeys: KeyboardEvent['key'][];
    /** Shown instead of `hotKeys` */
    content?: string[];
    preventDefault?: boolean;
    /** Element that listens for keydown; defaults to document.body */
    getListenerTarget?: () => HTMLElement | null | undefined;
}

export interface HotKeysEmits {
    hotKey: [event: KeyboardEvent];
}

export interface HotKeysSlots {
    /** Replaces the key hint; an empty slot renders nothing and the hot keys stay active */
    default?: () => VNode[];
}

export interface HotKeysState {}
