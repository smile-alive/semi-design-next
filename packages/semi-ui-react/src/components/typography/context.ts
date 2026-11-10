import { createContext } from '../../base/index';
import type { TypographyBaseSize } from './interface';

export const [SizeContext, useSizeContext] = createContext<TypographyBaseSize>('Typography', { defaultValue: 'normal' });
