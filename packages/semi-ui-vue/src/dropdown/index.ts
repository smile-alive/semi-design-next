import DropdownDivider from './dropdown-divider.vue';
import DropdownItem from './dropdown-item.vue';
import DropdownMenu from './dropdown-menu.vue';
import DropdownTitle from './dropdown-title.vue';
import Dropdown from './dropdown.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const DropdownWithParts: typeof Dropdown & {
    Menu: typeof DropdownMenu;
    Item: typeof DropdownItem;
    Divider: typeof DropdownDivider;
    Title: typeof DropdownTitle;
} = Object.assign(Dropdown, {
    Menu: DropdownMenu,
    Item: DropdownItem,
    Divider: DropdownDivider,
    Title: DropdownTitle,
});
export default DropdownWithParts;
export { default as DropdownMenu } from './dropdown-menu.vue';
export { default as DropdownItem } from './dropdown-item.vue';
export { default as DropdownDivider } from './dropdown-divider.vue';
export { default as DropdownTitle } from './dropdown-title.vue';
export type * from './interface';
