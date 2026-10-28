import type { Accessor } from 'solid-js';
import { createContext } from '../_base/create-context';
import type { TypographyBaseSize } from './interface';

export const [SizeContext, useSizeContext] = createContext<Accessor<TypographyBaseSize>>('Typography', { defaultValue: (): TypographyBaseSize => 'normal' });
