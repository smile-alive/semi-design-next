import type { ComputedRef } from 'vue';
import { createContext } from '../../base/create-context';
import type { TypographyBaseSize } from './interface';

export const [provideTypographyContext, useTypographyContext] = createContext<ComputedRef<TypographyBaseSize>>('Typography', { optional: true });
