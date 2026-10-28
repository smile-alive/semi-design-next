import type { Accessor, JSX } from 'solid-js';
import { createContext } from '../_base/create-context';
import type { ColProps } from '../grid/col';
import type { RowProps } from '../grid/row';

export type Grid = Pick<RowProps, 'align' | 'gutter' | 'justify' | 'type'> & Pick<ColProps, 'span' | 'offset' | 'order' | 'push' | 'pull' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'class' | 'style'>;

export type ListItemEventHandler = JSX.EventHandler<HTMLLIElement, MouseEvent>;

export interface ListContextValue {
    onRightClick?: ListItemEventHandler;
    onClick?: ListItemEventHandler;
    grid?: Grid;
}

export const [ListContext, useListContext] = createContext<Accessor<ListContextValue>>('List', { defaultValue: () => ({}) });
