import type { StyleValue, VNode } from 'vue';
import type { TimelineItemPosition, TimelineMode } from '@fibrae/semi-foundation/timeline/utils';

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
    /** Defaults to `item.content` */
    content?: (props: TimelineSlotProps) => VNode[];
    dot?: (props: TimelineSlotProps) => VNode[];
    /** Defaults to `item.time` */
    time?: (props: TimelineSlotProps) => VNode[];
    /** Defaults to `item.extra` */
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
    dot?: () => VNode[];
    time?: () => VNode[];
    extra?: () => VNode[];
}
