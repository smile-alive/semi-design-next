import Container from './container/container.vue';
import Sidebar from './sidebar.vue';
import CodeContent from './widget/code-content.vue';
import CodeItem from './widget/code-item.vue';
import FileContent from './widget/file-content.vue';
import FileItem from './widget/file-item.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
const SidebarWithParts: typeof Sidebar & {
    FileContent: typeof FileContent;
    CodeContent: typeof CodeContent;
    FileItem: typeof FileItem;
    CodeItem: typeof CodeItem;
    Container: typeof Container;
} = Object.assign(Sidebar, { FileContent, CodeContent, FileItem, CodeItem, Container });
export default SidebarWithParts;
export type { ContainerHandle as SidebarContainerHandle } from './container/interface';
export type { SideBarProps, SideBarEmits, SideBarSlots, SideBarOption, SideBarDetailContent, SideBarOptionSlotProps, SideBarOptionItemSlotProps, SideBarMainContentSlotProps, SideBarDetailHeaderSlotProps, SideBarDetailContentSlotProps } from './interface';
export type { CodeItemProps, CodeItemSlots, FileItemProps, FileItemEmits, ImageUploadNodeOptions } from './widget/interface';
