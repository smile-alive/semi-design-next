import { createContext } from '../../base/index.js';
import type { Grid } from './interface.js';

export interface ListContextValue {
    grid?: Grid;
    onClick?: (event: MouseEvent) => void;
    onRightClick?: (event: MouseEvent) => void;
}

// A ListItem also works on its own, as a plain li
export const [getListContext, setListContext] = createContext<ListContextValue>('List', { optional: true });
