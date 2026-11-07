import { createContext } from '../../base/create-context';
import type { LayoutContextValue } from './interface';

export const [provideLayoutContext, useLayoutContext] = createContext<LayoutContextValue>('Layout', { optional: true });
