import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLLiAttributes } from 'svelte/elements';
import type { TimelineItemPosition, TimelineMode } from '@fibrae/semi-foundation/timeline/utils';

export type { TimelineItemPosition, TimelineMode };
export type TimelineItemType = 'default' | 'ongoing' | 'success' | 'warning' | 'error';

/** An item of `dataSource`; nodes for its content, time and extra come from the Timeline snippets. Other attributes land on the li. */
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
    /** Content of each item; defaults to `item.content` */
    content?: Snippet<[TimelineSnippetProps]>;
    /** Time of each item; defaults to `item.time` */
    time?: Snippet<[TimelineSnippetProps]>;
    /** Extra of each item; defaults to `item.extra` */
    extra?: Snippet<[TimelineSnippetProps]>;
}
