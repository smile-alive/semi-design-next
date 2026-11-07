import type { JSX } from 'solid-js';
import type { TimelineMode } from '@fibrae/semi-foundation/components/timeline/utils';
import type { ElementProps } from '../../base/element-props';

export interface TimelineItemProps extends ElementProps<'li', 'content' | 'type'> {
    color?: string;
    time?: JSX.Element;
    type?: 'default' | 'ongoing' | 'success' | 'warning' | 'error';
    dot?: JSX.Element;
    extra?: JSX.Element;
    position?: 'left' | 'right';
}

export interface Data extends Omit<TimelineItemProps, 'children' | 'dot' | 'extra' | 'time'> {
    content?: string | number;
    time?: string | number;
    extra?: string | number;
}

export interface TimelineProps extends ElementProps<'ul'> {
    mode?: TimelineMode;
    dataSource?: Data[];
    /** Content of each dataSource item; defaults to `item.content` */
    renderContent?: (item: Data, index: number) => JSX.Element;
    renderDot?: (item: Data, index: number) => JSX.Element;
    /** Time of each dataSource item; defaults to `item.time` */
    renderTime?: (item: Data, index: number) => JSX.Element;
    /** Extra of each dataSource item; defaults to `item.extra` */
    renderExtra?: (item: Data, index: number) => JSX.Element;
}
