import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { strings } from '@fibrae/semi-foundation/anchor/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { Position } from '../tooltip/interface.js';
import type { ShowTooltip } from '../typography/interface.js';

/** A link is activated by a click or by Enter */
export type AnchorClickEvent = MouseEvent | KeyboardEvent;

export interface AnchorLinkItem {
    /** A fragment such as `#intro` is looked up by element id, anything else is a selector; defaults to `#` */
    href?: string;
    /** Plain-text title, also the native tooltip without showTooltip; the `title` snippet wins when given */
    title?: string;
    disabled?: boolean;
    /** Nested links */
    children?: AnchorLinkItem[];
}

export interface AnchorTitleContext {
    item: AnchorLinkItem;
    /** Nesting depth: 1 at the top */
    level: number;
}

// `title` is the link title snippet, not the native tooltip attribute HTMLAttributes declares
export interface AnchorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onclick' | 'onchange'> {
    /** The links, nested through `children`; a flat or nested list is known up front, so the first frame is complete */
    links?: AnchorLinkItem[];
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
    onChange?: (currentLink: string, previousLink: string) => void;
    /** Only when a link is activated, so a click elsewhere on the root does not reach it */
    onClick?: (event: AnchorClickEvent, currentLink: string) => void;
    /** Renders every link's title */
    title?: Snippet<[AnchorTitleContext]>;
}

export interface AnchorState {
    activeLink: string;
    links: string[];
    clickLink: boolean;
    slideBarTop: string;
}
