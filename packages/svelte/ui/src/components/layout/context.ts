import { createContext } from '../../base/create-context.js';
import type { LayoutContextValue } from './interface.js';

export const [getLayoutContext, setLayoutContext] = createContext<LayoutContextValue>('Layout', { optional: true });
