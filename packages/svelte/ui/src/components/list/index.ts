import ListItemPart from './item.svelte';
import ListBase from './list.svelte';

// Svelte components are functions, so the part attaches to the component itself
export const List: typeof ListBase & { Item: typeof ListItemPart } = Object.assign(ListBase, { Item: ListItemPart });
export { default as ListItem } from './item.svelte';
export type { Grid, ListItemProps, ListItemSnippetProps, ListProps } from './interface.js';
