import { createContext } from '../../base/index';
import type { TabContextValue } from './interface';

export const [TabsContext, useTabsContext] = createContext<TabContextValue>('Tabs', { defaultValue: {} });
