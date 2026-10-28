import type { StyleValue, VNode } from 'vue';
import type { TimelineItemPosition, TimelineMode } from '@fibrae/semi-foundation/timeline/utils';

export type { TimelineItemPosition, TimelineMode };
export type TimelineItemType = 'default' | 'ongoing' | 'success' | 'warning' | 'error';

/** An item of `dataSource`; nodes for its content, dot, time and extra come from the Timeline slots */
export interface TimelineData {
    content?: string | number;
    time?: string | number;
    extra?: string | number;
    color?: string;
    type?: TimelineItemType;
    position?: TimelineItemPosition;
    class?: string;
    style?: StyleValue;
    onClick?: (event: MouseEvent) => void;
}

export interface TimelineProps {
    mode?: TimelineMode;
    dataSource?: TimelineData[];
}

export interface TimelineSlotProps {
    item: TimelineData;
    index: number;
}

export interface TimelineSlots {
    /** Timeline.Item children, used when dataSource is empty */
    default?: () => VNode[];
    /** Content of each dataSource item; defaults to `item.content` */
    content?: (props: TimelineSlotProps) => VNode[];
    /** Dot of each dataSource item */
    dot?: (props: TimelineSlotProps) => VNode[];
    /** Time of each dataSource item; defaults to `item.time` */
    time?: (props: TimelineSlotProps) => VNode[];
    /** Extra of each dataSource item; defaults to `item.extra` */
    extra?: (props: TimelineSlotProps) => VNode[];
}

export interface TimelineItemProps {
    color?: string;
    type?: TimelineItemType;
    /** Read by Timeline to place the item in center and alternate modes */
    position?: TimelineItemPosition;
}

export interface TimelineItemSlots {
    default?: () => VNode[];
    /** Custom dot content */
    dot?: () => VNode[];
    time?: () => VNode[];
    extra?: () => VNode[];
}
