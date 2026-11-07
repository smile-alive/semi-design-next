import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
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
    onMotionEnd?: () => void;
    children?: Snippet;
}
