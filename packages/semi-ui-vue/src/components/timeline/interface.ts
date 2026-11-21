import type { ClassValue, StyleValue, VNode } from 'vue';
import type { TimelineItemPart, TimelinePart } from '@fibrae/semi-foundation/components/timeline/constants';
import type { TimelineItemPosition, TimelineMode } from '@fibrae/semi-foundation/components/timeline/utils';

export type { TimelineItemPosition, TimelineMode };
export type TimelineItemType = 'default' | 'ongoing' | 'success' | 'warning' | 'error';

export interface TimelineData {
    content?: string | number;
    time?: string | number;
    extra?: string | number;
    color?: string;
    type?: TimelineItemType;
    position?: TimelineItemPosition;
    class?: string;
    style?: StyleValue;
    classNames?: Partial<Record<TimelineItemPart, ClassValue>>;
    styles?: Partial<Record<TimelineItemPart, StyleValue>>;
    onClick?: (event: MouseEvent) => void;
}

export interface TimelineProps {
    /** `item*` keys apply to every Timeline.Item, before the item's own classNames */
    classNames?: Partial<Record<TimelinePart, ClassValue>>;
    mode?: TimelineMode;
    dataSource?: TimelineData[];
    styles?: Partial<Record<TimelinePart, StyleValue>>;
}

export interface TimelineSlotProps {
    item: TimelineData;
    index: number;
}

export interface TimelineSlots {
    /** Timeline.Item children, used when dataSource is empty */
    default?: () => VNode[];
    /** Defaults to `item.content` */
    content?: (props: TimelineSlotProps) => VNode[];
    dot?: (props: TimelineSlotProps) => VNode[];
    /** Defaults to `item.time` */
    time?: (props: TimelineSlotProps) => VNode[];
    /** Defaults to `item.extra` */
    extra?: (props: TimelineSlotProps) => VNode[];
}

export interface TimelineItemProps {
    /** Applied after the `item*` classNames of the parent Timeline */
    classNames?: Partial<Record<TimelineItemPart, ClassValue>>;
    color?: string;
    type?: TimelineItemType;
    /** Read by Timeline to place the item in center and alternate modes */
    position?: TimelineItemPosition;
    styles?: Partial<Record<TimelineItemPart, StyleValue>>;
}

export interface TimelineItemSlots {
    default?: () => VNode[];
    dot?: () => VNode[];
    time?: () => VNode[];
    extra?: () => VNode[];
}
