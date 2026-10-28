import { createToken } from '../_base/token';
import type { TabPaneProps } from './interface';

export const TAB_PANE = 'Tabs.TabPane';

// Tabs renders the pane from this token. No context is read here: the token is created in Tabs' children() memo,
// outside TabsContext.Provider.
export default function TabPane(props: TabPaneProps) {
    return createToken(TAB_PANE, props);
}
