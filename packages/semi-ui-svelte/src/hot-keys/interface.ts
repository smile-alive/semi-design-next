import type { HTMLAttributes } from 'svelte/elements';

export interface HotKeysProps extends HTMLAttributes<HTMLDivElement> {
    /** Keys that must be pressed together: any number of modifiers and exactly one other key */
    hotKeys: KeyboardEvent['key'][];
    /** Shown instead of `hotKeys` */
    content?: string[];
    preventDefault?: boolean;
    /** Element that listens for keydown; defaults to document.body */
    getListenerTarget?: () => HTMLElement | null | undefined;
    onHotKey?: (event: KeyboardEvent) => void;
}
