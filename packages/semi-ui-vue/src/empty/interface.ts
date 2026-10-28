import type { CSSProperties, VNode } from 'vue';
import type { strings } from '@fibrae/semi-foundation/empty/constants';

export type EmptyLayout = (typeof strings.LAYOUT)[number];

/** The id of an SVG sprite symbol on the page, drawn with `<use>` */
export interface EmptySvgNode {
    id: string;
}

export interface EmptyProps {
    layout?: EmptyLayout;
    imageStyle?: CSSProperties;
    /** Plain-text title; the `title` slot wins when both are given */
    title?: string;
    /** Image URL or sprite symbol; use the `image` slot for other content */
    image?: string | EmptySvgNode;
    /** Shown instead of `image` while the page is in dark mode */
    darkModeImage?: string | EmptySvgNode;
}

export interface EmptySlots {
    /** Actions below the description */
    default?: () => VNode[];
    title?: () => VNode[];
    description?: () => VNode[];
    image?: () => VNode[];
    darkModeImage?: () => VNode[];
}
