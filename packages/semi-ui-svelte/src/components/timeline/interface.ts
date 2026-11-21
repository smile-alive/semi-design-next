import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes, HTMLLiAttributes } from 'svelte/elements';
import type { TimelineItemPart, TimelinePart } from '@fibrae/semi-foundation/components/timeline/constants';
import type { TimelineItemPosition, TimelineMode } from '@fibrae/semi-foundation/components/timeline/utils';

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
    /** Applied after the `item*` classNames of the Timeline */
    classNames?: Partial<Record<TimelineItemPart, ClassValue>>;
    styles?: Partial<Record<TimelineItemPart, string>>;
    onClick?: (event: MouseEvent) => void;
}

export interface TimelineSnippetProps {
    item: TimelineData;
    index: number;
}

export interface TimelineProps extends HTMLAttributes<HTMLUListElement> {
    mode?: TimelineMode;
    dataSource?: TimelineData[];
    /** `item*` keys apply to every item, before the item's own classNames */
    classNames?: Partial<Record<TimelinePart, ClassValue>>;
    styles?: Partial<Record<TimelinePart, string>>;
    content?: Snippet<[TimelineSnippetProps]>;
    time?: Snippet<[TimelineSnippetProps]>;
    extra?: Snippet<[TimelineSnippetProps]>;
}
