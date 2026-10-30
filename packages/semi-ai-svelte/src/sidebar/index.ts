import Container from './container/container.svelte';
import SidebarBase from './sidebar.svelte';
import CodeContent from './widget/code-content.svelte';
import CodeItem from './widget/code-item.svelte';
import FileContent from './widget/file-content.svelte';
import FileItem from './widget/file-item.svelte';

export { Annotation } from './annotation/index.js';
export { MCPConfigure } from './mcp-configure/index.js';

// Svelte components are functions, so the parts attach to the component itself
export const Sidebar: typeof SidebarBase & {
    FileContent: typeof FileContent;
    CodeContent: typeof CodeContent;
    FileItem: typeof FileItem;
    CodeItem: typeof CodeItem;
    Container: typeof Container;
} = Object.assign(SidebarBase, { FileContent, CodeContent, FileItem, CodeItem, Container });
