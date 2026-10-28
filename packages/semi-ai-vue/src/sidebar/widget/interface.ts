import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { Extensions } from '@tiptap/core';
import type { CodeHighlightProps } from '@fibrae/semi-ui-vue/code-highlight/interface';
import type { JsonViewerCustomRenderSlotProps, JsonViewerProps, JsonViewerSearchButtonSlotProps } from '@fibrae/semi-ui-vue/json-viewer/interface';
import type { UploadEmits, UploadProps } from '@fibrae/semi-ui-vue/upload/interface';

/** Passed to the element as attributes; `class` and `style` join the built-in ones */
export interface ElementLook {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
}

export interface CodeItemProps {
    name?: string;
    language?: string;
    content?: string;
    isJson?: boolean;
    /** The value, width and height default to the content and the full size; `modelValue` overrides the content */
    jsonViewerProps?: Partial<JsonViewerProps> & ElementLook;
    codeHighlightProps?: Partial<CodeHighlightProps> & ElementLook;
}

export interface CodeItemSlots {
    /** JsonViewer's slot, for the tokens matched by `jsonViewerProps.options.customRenderRule` */
    customRender?: (props: JsonViewerCustomRenderSlotProps) => VNode[];
    /** JsonViewer's slot, replacing its search button */
    searchButton?: (props: JsonViewerSearchButtonSlotProps) => VNode[];
}

/** A CodeContent entry or a Sidebar detail; `key` identifies its panel, and a new key remounts the item */
export type CodeItemData = CodeItemProps & { key?: string };

/** Upload props and listeners for the image slot, which binds them to its Upload */
export type ImageUploadNodeOptions = Partial<UploadProps> &
    ElementLook & {
        /** Attributes of the slot node in the editor's HTML */
        HTMLAttributes?: Record<string, unknown>;
        /** The uploaded image's src from the upload response; by default the response itself or its `src` */
        getUploadImageSrc?: (response: any) => string;
    } & {
        [K in Exclude<keyof UploadEmits, 'update:fileList'> as `on${Capitalize<K>}`]?: (...args: UploadEmits[K]) => void;
    };

export interface FileItemProps {
    name?: string;
    /** HTML; a later value replaces the document without emitting contentChange */
    content?: string;
    editable?: boolean;
    /** Appended to the built-in extensions; read once, when the editor is created */
    extensions?: Extensions;
    /** Read once, when the editor is created */
    imgUploadProps?: ImageUploadNodeOptions;
}

export interface FileItemEmits {
    /** The document as HTML after an edit */
    contentChange: [content: string];
}

/** A FileContent entry or a Sidebar detail; `key` identifies its panel, and a new key remounts the editor */
export type FileItemData = FileItemProps & { key?: string };

interface CollapseListProps {
    activeKey?: string | string[];
}

interface CollapseListEmits<T> {
    'update:activeKey': [activeKey: string[]];
    /** A panel opened or closed through its arrow */
    change: [activeKey: string | string[]];
    /** The expand button beside a panel's header */
    expand: [event: MouseEvent, item: T, mode: string];
}

export interface CodeContentProps extends CollapseListProps {
    codes?: CodeItemData[];
}

export type CodeContentEmits = CollapseListEmits<CodeItemData>;

export interface FileContentProps extends CollapseListProps {
    /** Rendered read-only: each entry's extensions and imgUploadProps reach its preview */
    files?: FileItemData[];
}

export type FileContentEmits = CollapseListEmits<FileItemData>;
