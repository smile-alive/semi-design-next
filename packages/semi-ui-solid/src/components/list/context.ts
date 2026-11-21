import type { Accessor, JSX } from 'solid-js';
import type { ListPart } from '@fibrae/semi-foundation/components/list/constants';
import { createContext } from '../../base/index';
import type { ColProps } from '../grid/col';
import type { RowProps } from '../grid/row';

export type Grid = Pick<RowProps, 'align' | 'gutter' | 'justify'> & Pick<ColProps, 'span' | 'offset' | 'order' | 'push' | 'pull' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'class' | 'style'>;

export type ListItemEventHandler = JSX.EventHandler<HTMLLIElement, MouseEvent>;

export interface ListContextValue {
    onRightClick?: ListItemEventHandler;
    onClick?: ListItemEventHandler;
    grid?: Grid;
    classNames?: Partial<Record<ListPart, string>>;
    styles?: Partial<Record<ListPart, JSX.CSSProperties | string>>;
}

export const [ListContext, useListContext] = createContext<Accessor<ListContextValue>>('List', { defaultValue: () => ({}) });
