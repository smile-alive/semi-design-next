import type { StyleValue, VNode } from 'vue';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { ColProps, RowProps } from '../grid/interface';

/** Row and Col layout props shared by every item; `class` and `style` land on each item's Col */
export interface Grid extends Pick<RowProps, 'align' | 'gutter' | 'justify' | 'type'>, Pick<ColProps, 'span' | 'offset' | 'order' | 'push' | 'pull' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'> {
    class?: unknown;
    style?: StyleValue;
}

/**
 * `onClick` and `onRightClick` handle the click on an item, not on the list root, so they are function props;
 * their presence turns an item into a button. Callers still write `@click` and `@rightClick`.
 */
export interface ListProps<T> {
    bordered?: boolean;
    dataSource?: T[];
    grid?: Grid;
    layout?: 'vertical' | 'horizontal';
    loading?: boolean;
    size?: Size;
    split?: boolean;
    onClick?: (event: MouseEvent) => void;
    onRightClick?: (event: MouseEvent) => void;
}

export interface ListItemSlotProps<T> {
    item: T;
    index: number;
}

export interface ListSlots<T> {
    /** List.Item children, shown after the items of `dataSource` */
    default?: () => VNode[];
    item?: (props: ListItemSlotProps<T>) => VNode[];
    header?: () => VNode[];
    footer?: () => VNode[];
    emptyContent?: () => VNode[];
    loadMore?: () => VNode[];
}

export interface ListItemProps {
    align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    /** Takes precedence over the List's `onClick` */
    onClick?: (event: MouseEvent) => void;
    /** Takes precedence over the List's `onRightClick` */
    onRightClick?: (event: MouseEvent) => void;
}

export interface ListItemSlots {
    default?: () => VNode[];
    header?: () => VNode[];
    main?: () => VNode[];
    extra?: () => VNode[];
}
