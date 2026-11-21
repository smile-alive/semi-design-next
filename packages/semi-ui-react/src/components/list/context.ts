import type React from 'react';
import type { ListPart } from '@fibrae/semi-foundation/components/list/constants';
import { createContext } from '../../base/index';
import type { ColProps } from '../grid/col';
import type { RowProps } from '../grid/row';

export type Grid = Pick<RowProps, 'align' | 'gutter' | 'justify'> & Pick<ColProps, 'span' | 'offset' | 'order' | 'push' | 'pull' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'className' | 'style'>;

export interface ListContextValue {
    onRightClick?: React.MouseEventHandler<HTMLLIElement>;
    onClick?: React.MouseEventHandler<HTMLLIElement>;
    grid?: Grid;
    classNames?: Partial<Record<ListPart, string>>;
    styles?: Partial<Record<ListPart, React.CSSProperties>>;
}

export const [ListContext, useListContext] = createContext<ListContextValue>('List', { defaultValue: {} });
