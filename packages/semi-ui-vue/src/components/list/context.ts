import type { ComputedRef } from 'vue';
import { createContext } from '../../base/index';
import type { Grid, ListProps } from './interface';

export interface ListContextValue {
    grid?: Grid;
    classNames?: ListProps<unknown>['classNames'];
    styles?: ListProps<unknown>['styles'];
    onClick?: (event: MouseEvent) => void;
    onRightClick?: (event: MouseEvent) => void;
}

export const [provideListContext, useListContext] = createContext<ComputedRef<ListContextValue>>('List', { optional: true });
