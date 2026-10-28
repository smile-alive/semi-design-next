import type { VNode } from 'vue';

export interface CollapsibleProps {
    isOpen?: boolean;
    duration?: number;
    motion?: boolean;
    keepDOM?: boolean;
    lazyRender?: boolean;
    collapseHeight?: number;
    collapseHeightAdaptive?: boolean;
    fade?: boolean;
    /** Set on the inner content element, so a trigger's `aria-controls` can point at it. */
    id?: string;
}

export interface CollapsibleEmits {
    motionEnd: [];
}

export interface CollapsibleSlots {
    default?: () => VNode[];
}
