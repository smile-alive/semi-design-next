import TabItem from './tab-item.vue';
import TabPane from './tab-pane.vue';
import Tabs from './tabs.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const TabsWithParts: typeof Tabs & { TabPane: typeof TabPane; TabItem: typeof TabItem } = Object.assign(Tabs, {
    TabPane,
    TabItem,
});
export default TabsWithParts;
export { TabPane, TabItem };
export type {
    PlainTab,
    TabBarProps,
    TabItemEmits,
    TabItemProps,
    TabItemSlots,
    TabPaneProps,
    TabPaneSlots,
    TabPosition,
    TabsArrowSlotProps,
    TabsDropdownItemProps,
    TabsDropdownProps,
    TabSize,
    TabsEmits,
    TabsMore,
    TabsMoreContentSlotProps,
    TabsProps,
    TabsSlots,
    TabsTabBarSlotProps,
    TabsTabSlotProps,
    TabType,
} from './interface';
