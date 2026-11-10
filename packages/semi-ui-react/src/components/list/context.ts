import type React from 'react';
import { createContext } from '../../base/create-context';
import type { ColProps } from '../grid/col';
import type { RowProps } from '../grid/row';

export type Grid = Pick<RowProps, 'align' | 'gutter' | 'justify'> & Pick<ColProps, 'span' | 'offset' | 'order' | 'push' | 'pull' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'className' | 'style'>;

export interface ListContextValue {
    onRightClick?: React.MouseEventHandler<HTMLLIElement>;
    onClick?: React.MouseEventHandler<HTMLLIElement>;
    grid?: Grid;
}

export const [ListContext, useListContext] = createContext<ListContextValue>('List', { defaultValue: {} });
