import CodeContent from './code-content.svelte';
import CodeItem from './code-item.svelte';
import Container from './container/container.svelte';
import FileContent from './file-content.svelte';
import FileItem from './file-item.svelte';
import SidebarBase from './sidebar.svelte';

export { Annotation } from './annotation/index.js';
export { MCPConfigure } from './mcp-configure/index.js';

export const Sidebar: typeof SidebarBase & {
    FileContent: typeof FileContent;
    CodeContent: typeof CodeContent;
    FileItem: typeof FileItem;
    CodeItem: typeof CodeItem;
    Container: typeof Container;
} = Object.assign(SidebarBase, { FileContent, CodeContent, FileItem, CodeItem, Container });
