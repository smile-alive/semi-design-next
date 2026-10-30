import type { Snippet } from 'svelte';
import type { FloatButtonProps } from '../float-button/interface.js';

export interface BackTopProps extends Omit<FloatButtonProps, 'children' | 'disabled' | 'href' | 'rel' | 'target' | 'icon'> {
    /** Milliseconds the scroll to the top takes; clicks repeat at most this often */
    duration?: number;
    /** The scrolled element; defaults to the window. Read on mount and whenever the function itself changes */
    target?: () => Window | HTMLElement | null;
    /** The button shows once the target is scrolled beyond this many pixels */
    visibilityHeight?: number;
    /** Static content of the button, shown in place of the icon; must not contain interactive elements */
    children?: Snippet;
    icon?: Snippet;
}

export interface BackTopState {
    visible?: boolean;
}
