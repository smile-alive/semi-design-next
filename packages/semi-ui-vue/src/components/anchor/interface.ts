import type { VNode } from 'vue';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { strings } from '@fibrae/semi-foundation/components/anchor/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils';
import type { Position } from '../tooltip/interface';
import type { ShowTooltip } from '../typography/interface';

export type AnchorClickEvent = MouseEvent | KeyboardEvent;

export interface AnchorProps {
    autoCollapse?: boolean;
    defaultAnchor?: string;
    getContainer?: () => HTMLElement | Window | null;
    maxHeight?: string | number;
    maxWidth?: string | number;
    offsetTop?: number;
    position?: Position;
    railTheme?: ArrayElement<typeof strings.SLIDE_COLOR>;
    scrollMotion?: boolean;
    /** Passed to scroll-into-view-if-needed when a link is clicked; `scrollMotion` and `targetOffset` still apply */
    scrollIntoViewOptions?: ScrollIntoViewOptions;
    showTooltip?: boolean | ShowTooltip;
    size?: ArrayElement<typeof strings.SIZE>;
    targetOffset?: number;
}

export interface AnchorEmits {
    change: [currentLink: string, previousLink: string];
    /** Only when a link is activated, so a click elsewhere on the root does not reach it */
    click: [event: AnchorClickEvent, currentLink: string];
}

export interface AnchorSlots {
    default?: () => VNode[];
}

export type { AnchorBaseState as AnchorState } from '@fibrae/semi-foundation/components/anchor/foundation';

export interface LinkProps {
    disabled?: boolean;
    href?: string;
    /** Plain-text title, also the native tooltip without showTooltip; the `#title` slot wins when both are given */
    title?: string;
}

export interface AnchorLinkSlots {
    default?: () => VNode[];
    title?: () => VNode[];
}
