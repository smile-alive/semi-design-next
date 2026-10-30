import TabItemPart from './tab-item.svelte';
import TabsBase from './tabs.svelte';

// Svelte components are functions, so the part attaches to the component itself
export const Tabs: typeof TabsBase & { TabItem: typeof TabItemPart } = Object.assign(TabsBase, { TabItem: TabItemPart });
export { default as TabItem } from './tab-item.svelte';
export type { PlainTab, TabBarProps, TabItemProps, TabPosition, TabSize, TabsArrowSnippetProps, TabsDropdownItemProps, TabsDropdownProps, TabsMore, TabsMoreContentSnippetProps, TabsPanelSnippetProps, TabsProps, TabsTabBarSnippetProps, TabsTabSnippetProps, TabType } from './interface.js';
