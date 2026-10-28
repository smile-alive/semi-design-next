import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import type { TypographyBaseSize } from './interface';

/** The resolved size of the enclosing Typography, read by `size="inherit"` */
export const [provideTypographyContext, useTypographyContext] = createContext<ComputedRef<TypographyBaseSize>>('Typography', { optional: true });
