import ScrollItemPart from './scroll-item.svelte';
import ScrollListBase from './scroll-list.svelte';

// Svelte components are functions, so the parts attach to the component itself
export const ScrollList: typeof ScrollListBase & { Item: typeof ScrollItemPart } = Object.assign(ScrollListBase, { Item: ScrollItemPart });
export { default as ScrollItem } from './scroll-item.svelte';
export type { ScrollItemHandle, ScrollItemProps, ScrollItemSelectData, ScrollListItem, ScrollListProps } from './interface.js';
