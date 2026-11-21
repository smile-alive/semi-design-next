import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';

export const cssClasses = {
    SIDEBAR: `${BASE_CLASS_PREFIX}-sidebar`,
    COLLAPSE: `${BASE_CLASS_PREFIX}-sidebar-collapse`,
    SIDEBAR_CONTENT: `${BASE_CLASS_PREFIX}-sidebar-content`,
    MCP_CONFIGURE_CONTENT: `${BASE_CLASS_PREFIX}-sidebar-mcp-configure-content`,
    ANNOTATION_CONTENT: `${BASE_CLASS_PREFIX}-sidebar-annotation_content`,
    ANNOTATION_ITEM: `${BASE_CLASS_PREFIX}-sidebar-annotation-item`,
    ANNOTATION: `${BASE_CLASS_PREFIX}-sidebar-annotation`,
    OPTIONS: `${BASE_CLASS_PREFIX}-sidebar-options`,
    // The back button's container; focusAfterModeChange looks inside it
    DETAIL_HEADER_LEFT: `${BASE_CLASS_PREFIX}-sidebar-detail-header-left`,
    FILE: `${BASE_CLASS_PREFIX}-sidebar-file`,
};

/** Keys of `classNames` and `styles` on Sidebar.Container; the root element takes `className` and `style` */
export type SidebarContainerPart = 'header' | 'title' | 'close' | 'content';

/** Keys of `classNames` and `styles` on Sidebar; in detail modes `header`, `title` and `close` apply to the detail header, whose `close` button goes back to the main view */
export type SidebarPart = SidebarContainerPart | 'copy' | 'options' | 'option' | 'mainContent';

/** Keys of `classNames` and `styles` on Sidebar.FileContent; `item*` keys apply to every file panel */
export type SidebarFileContentPart = 'itemHeader' | 'itemExpand';

/** Keys of `classNames` and `styles` on Sidebar.CodeContent; `item*` keys apply to every code panel */
export type SidebarCodeContentPart = 'itemHeader' | 'itemExpand';

/** Keys of `classNames` and `styles` on Sidebar.FileItem; the root element takes `className` and `style` */
export type SidebarFileItemPart = 'menuBar' | 'editor';

/** Keys of `classNames` and `styles` on Annotation; the container keys are forwarded to Sidebar.Container, `group*` apply to each source group and `item*` to each source card */
export type AnnotationPart = SidebarContainerPart | 'groupHeader' | 'groupContent' | 'item' | 'itemTitle' | 'itemDetail' | 'itemFooter';

/** Keys of `classNames` and `styles` on MCPConfigure; the container keys are forwarded to Sidebar.Container, `item*` apply to each MCP entry */
export type MCPConfigurePart = SidebarContainerPart | 'toolbar' | 'count' | 'search' | 'list' | 'item' | 'itemIcon' | 'itemTitle' | 'itemDescription' | 'itemAction';

export const strings = {
    MODE: {
        MAIN: 'main',
        CODE: 'code',
        FILE: 'file',
    },
    MCP_MODE: {
        INNER: 'inner' as const,
        CUSTOM: 'custom' as const,
    },
    DIRECTION: {
        left: true,
        right: false,
        top: false,
        bottom: false,
        topLeft: false,
        topRight: false,
        bottomLeft: false,
        bottomRight: false,
    },
    JSON_VIEWER_OPTIONS: {
        readOnly: true,
        autoWrap: true,
    },
};
