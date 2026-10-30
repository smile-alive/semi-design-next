import { createContext } from '../_base/create-context.js';
import type { TypographyBaseSize } from './interface.js';

export interface TypographyContextValue {
    /** The resolved size of the enclosing Typography, read by `size="inherit"` */
    readonly size: TypographyBaseSize;
}

export const [getTypographyContext, setTypographyContext] = createContext<TypographyContextValue>('Typography', { optional: true });
