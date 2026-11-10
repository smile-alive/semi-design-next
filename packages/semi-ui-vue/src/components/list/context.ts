import type { ComputedRef } from 'vue';
import { createContext } from '../../base/index';
import type { Grid } from './interface';

export interface ListContextValue {
    grid?: Grid;
    onClick?: (event: MouseEvent) => void;
    onRightClick?: (event: MouseEvent) => void;
}

export const [provideListContext, useListContext] = createContext<ComputedRef<ListContextValue>>('List', { optional: true });
