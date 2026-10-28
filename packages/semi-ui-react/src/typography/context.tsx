import { createContext } from '../_base/create-context';
import type { TypographyBaseSize } from './interface';

export const [SizeContext, useSizeContext] = createContext<TypographyBaseSize>('Typography', { defaultValue: 'normal' });
