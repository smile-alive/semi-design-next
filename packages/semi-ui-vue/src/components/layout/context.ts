import { createContext } from '../../base/index';
import type { LayoutContextValue } from './interface';

export const [provideLayoutContext, useLayoutContext] = createContext<LayoutContextValue>('Layout', { optional: true });
