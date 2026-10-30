import type { Snippet } from 'svelte';
import type { ContainerProps } from './container/interface.js';
import type { CodeItemData, CodeItemSnippets, FileItemData, ImageUploadNodeOptions } from './widget/interface.js';

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
    /** Selects the option, as the built-in button does */
    onClick: (event: MouseEvent) => void;
}

export interface SideBarMainContentSnippetProps {
    activeKey: string | undefined;
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
    /** The back button of the detail header */
    onBackWard?: (event: MouseEvent, mode: string) => void;
    /** After the copy button wrote the detail content to the clipboard, or failed to */
    onDetailContentCopy?: (event: MouseEvent, content: string, success: boolean) => void;
    /** An edit in file mode, as HTML */
    onFileContentChange?: (content: string) => void;
    /** The icon of the built-in option button */
    optionIcon?: Snippet<[SideBarOptionSnippetProps]>;
    /** Replaces the whole option button */
    optionItem?: Snippet<[SideBarOptionItemSnippetProps]>;
    /** Below the options in main mode */
    mainContent?: Snippet<[SideBarMainContentSnippetProps]>;
    /** Replaces the header in detail modes */
    detailHeader?: Snippet<[SideBarDetailHeaderSnippetProps]>;
    /** Replaces the content in detail modes; named apart from the `detailContent` data */
    detailBody?: Snippet<[SideBarDetailBodySnippetProps]>;
}
