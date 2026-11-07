import Container from './container/container.svelte';
import SidebarBase from './sidebar.svelte';
import CodeContent from './widgets/code-content.svelte';
import CodeItem from './widgets/code-item.svelte';
import FileContent from './widgets/file-content.svelte';
import FileItem from './widgets/file-item.svelte';

export { Annotation } from './annotation/index.js';
export { MCPConfigure } from './mcp-configure/index.js';

export const Sidebar: typeof SidebarBase & {
    FileContent: typeof FileContent;
    CodeContent: typeof CodeContent;
    FileItem: typeof FileItem;
    CodeItem: typeof CodeItem;
    Container: typeof Container;
} = Object.assign(SidebarBase, { FileContent, CodeContent, FileItem, CodeItem, Container });
