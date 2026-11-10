import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { Extensions } from '@tiptap/core';
import type { CodeHighlightProps } from '@fibrae/semi-ui-vue/code-highlight/interface';
import type { JsonViewerCustomRenderSlotProps, JsonViewerProps, JsonViewerSearchButtonSlotProps } from '@fibrae/semi-ui-vue/json-viewer/interface';
import type { UploadEmits, UploadProps } from '@fibrae/semi-ui-vue/upload/interface';
import type { ContainerEmits, ContainerProps } from './container/interface';

export interface SideBarOption {
    name: string;
    key: string;
}

export type SideBarDetailContent = CodeItemData | FileItemData;

export interface SideBarProps extends ContainerProps {
    /** `main`, `code`, `file` or a custom mode rendered through `#detailContent` */
    mode?: string;
    activeKey?: string;
    options?: SideBarOption[];
    /** The item shown in code or file mode; a new `key` remounts it */
    detailContent?: SideBarDetailContent;
    fileEditable?: boolean;
    imgUploadProps?: ImageUploadNodeOptions;
}

export interface SideBarEmits extends ContainerEmits {
    /** Emitted before `activeOptionChange`, so `v-model:activeKey` follows the clicked option */
    'update:activeKey': [activeKey: string];
    activeOptionChange: [event: MouseEvent, activeKey: string];
    backWard: [event: MouseEvent, mode: string];
    /** After the copy button wrote the detail content to the clipboard, or failed to */
    detailContentCopy: [event: MouseEvent, content: string, success: boolean];
    fileContentChange: [content: string];
}

export interface SideBarOptionSlotProps {
    item: SideBarOption;
    index: number;
}

export interface SideBarOptionItemSlotProps extends SideBarOptionSlotProps {
    active: boolean;
    onClick: (event: MouseEvent) => void;
}

export interface SideBarMainContentSlotProps {
    activeKey?: string;
}

export interface SideBarDetailHeaderSlotProps {
    mode: string;
    detailContent?: SideBarDetailContent;
}

export interface SideBarDetailContentSlotProps {
    mode: string;
}

/** `customRender` and `searchButton` reach the JsonViewer of the built-in code detail */
export interface SideBarSlots extends CodeItemSlots {
    /** The main-mode title; the `title` prop is its plain-text form */
    title?: () => VNode[];
    optionIcon?: (props: SideBarOptionSlotProps) => VNode[];
    optionItem?: (props: SideBarOptionItemSlotProps) => VNode[];
    mainContent?: (props: SideBarMainContentSlotProps) => VNode[];
    /** The header in detail modes; empty content falls back to the built-in one */
    detailHeader?: (props: SideBarDetailHeaderSlotProps) => VNode[];
    /** The content in detail modes; empty content falls back to the built-in code or file item */
    detailContent?: (props: SideBarDetailContentSlotProps) => VNode[];
}

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
    searchButton?: (props: JsonViewerSearchButtonSlotProps) => VNode[];
}

/** A CodeContent entry or a Sidebar detail; `key` identifies its panel, and a new key remounts the item */
export type CodeItemData = CodeItemProps & { key?: string };

/** Upload props and listeners for the image slot, which binds them to its Upload */
export type ImageUploadNodeOptions = Partial<UploadProps> &
    ElementLook & {
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
    contentChange: [content: string];
}

/** A FileContent entry or a Sidebar detail; `key` identifies its panel, and a new key remounts the editor */
export type FileItemData = FileItemProps & { key?: string };

interface CollapseListProps {
    activeKey?: string | string[];
}

interface CollapseListEmits<T> {
    'update:activeKey': [activeKey: string[]];
    change: [activeKey: string | string[]];
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
