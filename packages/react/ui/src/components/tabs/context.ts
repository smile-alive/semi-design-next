import { createContext } from '../../base/create-context';
import type { TabContextValue } from './interface';

export const [TabsContext, useTabsContext] = createContext<TabContextValue>('Tabs', { defaultValue: {} });
