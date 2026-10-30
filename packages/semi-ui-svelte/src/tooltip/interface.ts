import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { strings } from '@fibrae/semi-foundation/tooltip/constants';
import type { Position, TooltipBaseProps } from '@fibrae/semi-foundation/tooltip/foundation';

export type { Position } from '@fibrae/semi-foundation/tooltip/foundation';
export type Trigger = (typeof strings.TRIGGER_SET)[number];

export interface FocusTarget {
    focus: (options?: FocusOptions) => void;
}

export interface RenderContentProps {
    /** Focused once the popup has opened: `<input {@attach initialFocusRef} />`, or call it with a handle that has focus() */
    initialFocusRef: (target: FocusTarget) => void;
}

/**
 * What Tooltip puts on the trigger element, spread first: `<button {...props}>`. Attributes written after the spread
 * override it; the attachment under a symbol key hands the element to Tooltip and must survive the spread.
 */
export interface TooltipTriggerProps {
    'data-popupid': string;
    tabindex?: number;
    'aria-describedby'?: string;
    'aria-expanded'?: 'true' | 'false';
    'aria-haspopup'?: 'dialog';
    'aria-controls'?: string;
    [key: symbol]: Attachment<HTMLElement>;
}

// No element props: Tooltip has no root DOM, so undeclared props are dropped (F11)
export interface TooltipProps extends TooltipBaseProps {
    /** Wrapped in Tooltip's span, which takes the trigger attributes */
    children?: Snippet;
    /** Renders the trigger element itself, which takes `props`; wins over children */
    child?: Snippet<[{ props: TooltipTriggerProps }]>;
    content?: Snippet<[RenderContentProps]>;
    /** Replaces the default arrow while showArrow is true */
    arrow?: Snippet;
    /** On the popup */
    class?: string;
    /** On the popup, before the positioning declarations; its `background-color` also colors the arrow */
    style?: string;
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    prefixCls?: string;
    spacing?: number | { x: number; y: number };
    showArrow?: boolean;
    role?: string;
    /** Name and description of a role="dialog" popup (F12); ignored for other roles */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    arrowPointAtCenter?: boolean;
    stopPropagation?: boolean;
    wrapperClassName?: string;
    wrapperId?: string;
    /**
     * Whether a disabled or loading Semi Button, Switch or Checkbox that fills the default span gets its pointer events
     * through the span (F4); false leaves it as it is
     */
    wrapWhenSpecial?: boolean;
    keepDOM?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    onClickOutSide?: (event: MouseEvent) => void;
    onEscKeyDown?: (event: KeyboardEvent) => void;
    /** Once per opening when the popup is shown, as its enter transition starts */
    onOpen?: () => void;
    /** Once per opening after the enter transition, not for an opening closed before it finishes */
    afterOpen?: () => void;
    afterClose?: () => void;
}
