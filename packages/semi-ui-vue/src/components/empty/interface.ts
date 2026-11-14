import type { ClassValue, StyleValue, VNode } from 'vue';
import type { EmptyPart, strings } from '@fibrae/semi-foundation/components/empty/constants';

export type EmptyLayout = (typeof strings.LAYOUT)[number];

/** The id of an SVG sprite symbol on the page, drawn with `<use>` */
export interface EmptySvgNode {
    id: string;
}

export interface EmptyProps {
    layout?: EmptyLayout;
    classNames?: Partial<Record<EmptyPart, ClassValue>>;
    styles?: Partial<Record<EmptyPart, StyleValue>>;
    /** Plain-text title; the `title` slot wins when both are given */
    title?: string;
    /** Image URL or sprite symbol; use the `image` slot for other content */
    image?: string | EmptySvgNode;
    darkModeImage?: string | EmptySvgNode;
}

export interface EmptySlots {
    default?: () => VNode[];
    title?: () => VNode[];
    description?: () => VNode[];
    image?: () => VNode[];
    darkModeImage?: () => VNode[];
}
