import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Extensions } from '@tiptap/core';
import type { CodeHighlightProps } from '@fibrae/semi-ui-svelte/code-highlight/interface';
import type { JsonViewerCustomRenderArgs, JsonViewerProps, JsonViewerSearchButtonArgs } from '@fibrae/semi-ui-svelte/json-viewer/interface';
import type { UploadProps } from '@fibrae/semi-ui-svelte/upload/interface';
import type { ContainerProps } from './container/interface.js';

export interface SideBarOption {
    name: string;
    key: string;
}

export type SideBarDetailContent = CodeItemData | FileItemData;

export interface SideBarOptionSnippetProps {
    item: SideBarOption;
    index: number;
}

export interface SideBarOptionItemSnippetProps extends SideBarOptionSnippetProps {
    active: boolean;
    onClick: (event: MouseEvent) => void;
}

export interface SideBarMainContentSnippetProps {
    activeKey?: string;
}

export interface SideBarDetailHeaderSnippetProps {
    mode: string;
    detailContent?: SideBarDetailContent;
}

export interface SideBarDetailBodySnippetProps {
    mode: string;
}

// `header` is the detail header here, and `children` has no meaning: the content follows `mode`
export interface SideBarProps extends Omit<ContainerProps, 'header' | 'children'>, CodeItemSnippets {
    /** `main`, `code`, `file` or a custom mode rendered through `detailBody` */
    mode?: string;
    /** Bindable; the selected option in main mode */
    activeKey?: string;
    options?: SideBarOption[];
    /** The item shown in code or file mode; a new `key` remounts it */
    detailContent?: SideBarDetailContent;
    fileEditable?: boolean;
    imgUploadProps?: ImageUploadNodeOptions;
    /** After `activeKey` took the clicked option */
    onActiveOptionChange?: (event: MouseEvent, activeKey: string) => void;
    onBackWard?: (event: MouseEvent, mode: string) => void;
    /** After the copy button wrote the detail content to the clipboard, or failed to */
    onDetailContentCopy?: (event: MouseEvent, content: string, success: boolean) => void;
    /** An edit in file mode, as HTML */
    onFileContentChange?: (content: string) => void;
    optionIcon?: Snippet<[SideBarOptionSnippetProps]>;
    optionItem?: Snippet<[SideBarOptionItemSnippetProps]>;
    mainContent?: Snippet<[SideBarMainContentSnippetProps]>;
    detailHeader?: Snippet<[SideBarDetailHeaderSnippetProps]>;
    /** Replaces the content in detail modes; named apart from the `detailContent` data */
    detailBody?: Snippet<[SideBarDetailBodySnippetProps]>;
}

interface CodeItemOwnProps {
    name?: string;
    language?: string;
    content?: string;
    isJson?: boolean;
    /** The value, width and height default to the content and the full size; `value` overrides the content */
    jsonViewerProps?: Partial<JsonViewerProps>;
    codeHighlightProps?: Partial<CodeHighlightProps>;
}

export interface CodeItemSnippets {
    /** JsonViewer's snippet, for the tokens matched by `jsonViewerProps.options.customRenderRule` */
    customRender?: Snippet<[JsonViewerCustomRenderArgs]>;
    searchButton?: Snippet<[JsonViewerSearchButtonArgs]>;
}

export interface CodeItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>, CodeItemOwnProps, CodeItemSnippets {}

/** A CodeContent entry or a Sidebar detail; `key` identifies its panel, and a new key remounts the item */
export type CodeItemData = CodeItemOwnProps & { key?: string };

/** Upload props and listeners for the image slot, which binds them to its Upload; `class` goes on the slot node */
export interface ImageUploadNodeOptions extends Partial<UploadProps> {
    HTMLAttributes?: Record<string, unknown>;
    /** The uploaded image's src from the upload response; by default the response itself or its `src` */
    getUploadImageSrc?: (response: any) => string;
}

interface FileItemOwnProps {
    name?: string;
    /** HTML; a later value replaces the document without calling onContentChange */
    content?: string;
    editable?: boolean;
    /** Appended to the built-in extensions; read once, when the editor is created */
    extensions?: Extensions;
    /** Read once, when the editor is created */
    imgUploadProps?: ImageUploadNodeOptions;
}

export interface FileItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>, FileItemOwnProps {
    onContentChange?: (content: string) => void;
}

/** A FileContent entry or a Sidebar detail; `key` identifies its panel, and a new key remounts the editor */
export type FileItemData = FileItemOwnProps & { key?: string };

interface CollapseListProps<T> {
    /** Bindable; the open panels */
    activeKey?: string | string[];
    onChange?: (activeKey: string | string[]) => void;
    /** The expand button beside a panel's header; without it the button is not rendered */
    onExpand?: (event: MouseEvent, item: T, mode: string) => void;
}

export interface CodeContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'children'>, CollapseListProps<CodeItemData>, CodeItemSnippets {
    codes?: CodeItemData[];
}

export interface FileContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'children'>, CollapseListProps<FileItemData> {
    /** Rendered read-only: each entry's extensions and imgUploadProps reach its preview */
    files?: FileItemData[];
}
