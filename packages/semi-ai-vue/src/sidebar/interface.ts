import type { VNode } from 'vue';
import type { ContainerEmits, ContainerProps } from './container/interface';
import type { CodeItemData, CodeItemSlots, FileItemData, ImageUploadNodeOptions } from './widget/interface';

export interface SideBarOption {
    name: string;
    key: string;
}

export type SideBarDetailContent = CodeItemData | FileItemData;

export interface SideBarProps extends ContainerProps {
    /** `main`, `code`, `file` or a custom mode rendered through `#detailContent` */
    mode?: string;
    /** The selected option in main mode */
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
    /** The back button of the detail header */
    backWard: [event: MouseEvent, mode: string];
    /** After the copy button wrote the detail content to the clipboard, or failed to */
    detailContentCopy: [event: MouseEvent, content: string, success: boolean];
    /** An edit in file mode, as HTML */
    fileContentChange: [content: string];
}

export interface SideBarOptionSlotProps {
    item: SideBarOption;
    index: number;
}

export interface SideBarOptionItemSlotProps extends SideBarOptionSlotProps {
    active: boolean;
    /** Selects the option, as the built-in button does */
    onClick: (event: MouseEvent) => void;
}

export interface SideBarMainContentSlotProps {
    activeKey: string | undefined;
}

export interface SideBarDetailHeaderSlotProps {
    mode: string;
    detailContent: SideBarDetailContent | undefined;
}

export interface SideBarDetailContentSlotProps {
    mode: string;
}

/** `customRender` and `searchButton` reach the JsonViewer of the built-in code detail */
export interface SideBarSlots extends CodeItemSlots {
    /** The main-mode title; the `title` prop is its plain-text form */
    title?: () => VNode[];
    /** The icon of the built-in option button */
    optionIcon?: (props: SideBarOptionSlotProps) => VNode[];
    /** Replaces the whole option button */
    optionItem?: (props: SideBarOptionItemSlotProps) => VNode[];
    /** Below the options in main mode */
    mainContent?: (props: SideBarMainContentSlotProps) => VNode[];
    /** The header in detail modes; empty content falls back to the built-in one */
    detailHeader?: (props: SideBarDetailHeaderSlotProps) => VNode[];
    /** The content in detail modes; empty content falls back to the built-in code or file item */
    detailContent?: (props: SideBarDetailContentSlotProps) => VNode[];
}
