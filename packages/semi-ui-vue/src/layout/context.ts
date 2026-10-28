import { createContext } from '../_base/create-context';
import type { LayoutContextValue } from './interface';

export const [provideLayoutContext, useLayoutContext] = createContext<LayoutContextValue>('Layout', { optional: true });
