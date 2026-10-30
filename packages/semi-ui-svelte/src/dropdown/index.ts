import DropdownDividerPart from './dropdown-divider.svelte';
import DropdownItemPart from './dropdown-item.svelte';
import DropdownMenuPart from './dropdown-menu.svelte';
import DropdownTitlePart from './dropdown-title.svelte';
import DropdownBase from './dropdown.svelte';

// Svelte components are functions, so the parts attach to the component itself
export const Dropdown: typeof DropdownBase & {
    Menu: typeof DropdownMenuPart;
    Item: typeof DropdownItemPart;
    Divider: typeof DropdownDividerPart;
    Title: typeof DropdownTitlePart;
} = Object.assign(DropdownBase, { Menu: DropdownMenuPart, Item: DropdownItemPart, Divider: DropdownDividerPart, Title: DropdownTitlePart });
export { default as DropdownDivider } from './dropdown-divider.svelte';
export { default as DropdownItem } from './dropdown-item.svelte';
export { default as DropdownMenu } from './dropdown-menu.svelte';
export { default as DropdownTitle } from './dropdown-title.svelte';
export type { DropDownMenuItem, DropDownMenuItemDivider, DropDownMenuItemItem, DropDownMenuItemTitle, DropdownDividerProps, DropdownHandle, DropdownItemProps, DropdownMenuIconArgs, DropdownMenuProps, DropdownProps, DropdownTitleProps, DropdownTriggerProps } from './interface.js';
