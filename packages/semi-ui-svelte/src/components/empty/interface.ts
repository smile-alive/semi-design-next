import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { EmptyPart, strings } from '@fibrae/semi-foundation/components/empty/constants';

export type EmptyLayout = (typeof strings.LAYOUT)[number];

export interface EmptySvgNode {
    id: string;
}

/** Image URL, sprite symbol, or a snippet for any other content */
export type EmptyImage = string | EmptySvgNode | Snippet;

// `title` is the heading here, so the native tooltip attribute is not accepted
export interface EmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    layout?: EmptyLayout;
    classNames?: Partial<Record<EmptyPart, ClassValue>>;
    styles?: Partial<Record<EmptyPart, string>>;
    title?: string | Snippet;
    image?: EmptyImage;
    /** Shown instead of `image` while the page is in dark mode */
    darkModeImage?: EmptyImage;
    description?: Snippet;
    children?: Snippet;
}
