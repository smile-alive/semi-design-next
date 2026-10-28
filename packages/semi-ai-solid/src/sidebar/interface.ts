import type { JSX, Ref } from 'solid-js';
import type { ContainerProps } from '@fibrae/semi-ai-foundation/sidebar/container-foundation';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import type { CodeItemProps } from './widget/code';
import type { FileItemProps } from './widget/file';
import type { ImageUploadNodeOptions } from './widget/image-slot';

export interface SideBarCollapseProps extends ElementProps<'div', 'onChange'> {
    activeKey?: string | string[];
    onChange?: (activeKey: string | string[]) => void;
}

export interface ContainerSolidProps extends ElementProps<'div', 'title' | 'style' | 'children' | 'onCancel'>, Omit<ContainerProps, 'title' | 'style' | 'className' | 'children' | 'onCancel'> {
    title?: JSX.Element;
    renderHeader?: () => JSX.Element;
    style?: JSX.CSSProperties | string;
    /** Receives the `.semi-sidebar-container` div, as `ref` does */
    containerRef?: Ref<HTMLDivElement>;
    children?: JSX.Element;
    /** The close button or, with `closeOnEsc`, Escape */
    onCancel?: (e: MouseEvent | KeyboardEvent) => void;
}

/** Data only; the button icon comes from `renderOptionIcon` */
export interface Option {
    name: string;
    key: string;
}

export interface OptionProps {
    activeKey?: string;
    options?: Option[];
    /** The icon of the built-in option button */
    renderOptionIcon?: (option: Option) => JSX.Element;
    renderOptionItem?: (option: Option, onChange: (e: MouseEvent, activeKey: string) => void) => JSX.Element;
    onChange?: (e: MouseEvent, activeKey: string) => void;
}

export type DetailContent = CodeItemProps | Omit<FileItemProps, 'editable' | 'imgUploadProps' | 'onContentChange'>;

export interface SideBarProps extends Omit<ContainerSolidProps, 'onChange'>, Omit<OptionProps, 'onChange'> {
    /** main, code, file or a custom mode */
    mode?: string;
    detailContent?: DetailContent;
    onActiveOptionChange?: (e: MouseEvent, activeKey: string) => void;
    renderMainContent?: (activeKey: string) => JSX.Element;
    renderDetailHeader?: (mode: string, detailContent?: DetailContent) => JSX.Element;
    renderDetailContent?: (mode: string) => JSX.Element;
    fileEditable?: boolean;
    onFileContentChange?: (content: string) => void;
    onBackWard?: (e: MouseEvent, mode: string) => void | Promise<unknown>;
    onDetailContentCopy?: (e: MouseEvent, content: string, res: boolean) => void;
    imgUploadProps?: ImageUploadNodeOptions;
}
