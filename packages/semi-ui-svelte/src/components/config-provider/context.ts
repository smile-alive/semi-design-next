import { createContext } from '../../base/index.js';
import type { ContextValue } from './interface.js';

// The value's fields are getters over the provider's state, so readers stay reactive by reading `config.x`
export const [getConfigContext, setConfigContext] = createContext<ContextValue>('ConfigProvider', { defaultValue: {} });
export type { ContextValue } from './interface.js';
