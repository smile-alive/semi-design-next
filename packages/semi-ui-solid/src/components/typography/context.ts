import type { Accessor } from 'solid-js';
import { createContext } from '../../base/index';
import type { TypographyBaseSize } from './interface';

export const [SizeContext, useSizeContext] = createContext<Accessor<TypographyBaseSize>>('Typography', { defaultValue: (): TypographyBaseSize => 'normal' });
