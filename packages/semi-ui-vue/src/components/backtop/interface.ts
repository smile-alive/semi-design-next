import type { ClassValue, StyleValue, VNode } from 'vue';
import type { BackTopPart } from '@fibrae/semi-foundation/components/backtop/constants';
import type { FloatButtonProps } from '../float-button/interface';

export interface BackTopProps extends Pick<FloatButtonProps, 'badge' | 'colorful' | 'shape' | 'size'> {
    classNames?: Partial<Record<BackTopPart, ClassValue>>;
    styles?: Partial<Record<BackTopPart, StyleValue>>;
    /** Milliseconds the scroll to the top takes; clicks repeat at most this often */
    duration?: number;
    /** The scrolled element; defaults to the window. Read on mount and whenever the function itself changes */
    target?: () => Window | HTMLElement | null;
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

export type { BackTopState } from '@fibrae/semi-foundation/components/backtop/foundation';
