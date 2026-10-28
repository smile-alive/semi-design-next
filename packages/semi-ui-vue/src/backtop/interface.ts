import type { VNode } from 'vue';
import type { FloatButtonProps } from '../float-button/interface';

export interface BackTopProps extends Pick<FloatButtonProps, 'badge' | 'colorful' | 'shape' | 'size'> {
    /** Milliseconds the scroll to the top takes; clicks repeat at most this often */
    duration?: number;
    /** The scrolled element; defaults to the window. Read on mount and whenever the function itself changes */
    target?: () => Window | HTMLElement | null;
    /** The button shows once the target is scrolled beyond this many pixels */
    visibilityHeight?: number;
}

export interface BackTopSlots {
    /** Static content of the button, shown in place of the icon; must not contain interactive elements */
    default?: () => VNode[];
    /** Custom badge count, in place of `badge.count` */
    badgeCount?: () => VNode[];
    icon?: () => VNode[];
}

export interface BackTopEmits {
    /** Throttled by `duration`, and emitted once the scroll has started */
    click: [event: MouseEvent];
}

export interface BackTopState {
    visible?: boolean;
}
