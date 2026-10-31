import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLLiAttributes } from 'svelte/elements';
import type { TimelineItemPosition, TimelineMode } from '@fibrae/semi-foundation/timeline/utils';

export type { TimelineItemPosition, TimelineMode };
export type TimelineItemType = 'default' | 'ongoing' | 'success' | 'warning' | 'error';

export interface TimelineData extends Omit<HTMLLiAttributes, 'color' | 'content' | 'onclick'> {
    content?: string | number;
    time?: string | number;
    extra?: string | number;
    color?: string;
    type?: TimelineItemType;
    position?: TimelineItemPosition;
    /** Custom dot of this item; items without it draw the default circle */
    dot?: Snippet;
    onClick?: (event: MouseEvent) => void;
}

export interface TimelineSnippetProps {
    item: TimelineData;
    index: number;
}

export interface TimelineProps extends HTMLAttributes<HTMLUListElement> {
    mode?: TimelineMode;
    dataSource?: TimelineData[];
    content?: Snippet<[TimelineSnippetProps]>;
    time?: Snippet<[TimelineSnippetProps]>;
    extra?: Snippet<[TimelineSnippetProps]>;
}
