import { createContext } from '../../base/index.js';
import type { LayoutContextValue } from './interface.js';

export const [getLayoutContext, setLayoutContext] = createContext<LayoutContextValue>('Layout', { optional: true });
