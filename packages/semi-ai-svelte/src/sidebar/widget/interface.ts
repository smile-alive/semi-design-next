import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Extensions } from '@tiptap/core';
import type { CodeHighlightProps } from '@fibrae/semi-ui-svelte/code-highlight/interface';
import type { JsonViewerCustomRenderArgs, JsonViewerProps, JsonViewerSearchButtonArgs } from '@fibrae/semi-ui-svelte/json-viewer/interface';
import type { UploadProps } from '@fibrae/semi-ui-svelte/upload/interface';

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
    /** JsonViewer's snippet, replacing its search button */
    searchButton?: Snippet<[JsonViewerSearchButtonArgs]>;
}

export interface CodeItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>, CodeItemOwnProps, CodeItemSnippets {}

/** A CodeContent entry or a Sidebar detail; `key` identifies its panel, and a new key remounts the item */
export type CodeItemData = CodeItemOwnProps & { key?: string };

/** Upload props and listeners for the image slot, which binds them to its Upload; `class` goes on the slot node */
export interface ImageUploadNodeOptions extends Partial<UploadProps> {
    /** Attributes of the slot node in the editor's HTML */
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
    /** The document as HTML after an edit */
    onContentChange?: (content: string) => void;
}

/** A FileContent entry or a Sidebar detail; `key` identifies its panel, and a new key remounts the editor */
export type FileItemData = FileItemOwnProps & { key?: string };

interface CollapseListProps<T> {
    /** Bindable; the open panels */
    activeKey?: string | string[];
    /** A panel opened or closed through its arrow */
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
