import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { strings } from '@fibrae/semi-foundation/empty/constants';

export type EmptyLayout = (typeof strings.LAYOUT)[number];

/** The id of an SVG sprite symbol on the page, drawn with `<use>` */
export interface EmptySvgNode {
    id: string;
}

/** Image URL, sprite symbol, or a snippet for any other content */
export type EmptyImage = string | EmptySvgNode | Snippet;

// `title` is the heading here, so the native tooltip attribute is not accepted
export interface EmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    layout?: EmptyLayout;
    /** Inline style of the image box */
    imageStyle?: string;
    title?: string | Snippet;
    image?: EmptyImage;
    /** Shown instead of `image` while the page is in dark mode */
    darkModeImage?: EmptyImage;
    description?: Snippet;
    /** Actions below the description */
    children?: Snippet;
}
