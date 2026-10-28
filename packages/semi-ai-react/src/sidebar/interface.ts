import React, { type CSSProperties, type ReactNode } from 'react';
import type { ContainerProps } from '@fibrae/semi-ai-foundation/sidebar/container-foundation';
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
import type { CodeItemProps } from './widget/code';
import type { FileItemProps } from './widget/file';
import type { ImageUploadNodeOptions } from './widget/image-slot';

export interface SideBarCollapseProps extends ElementProps<'div', 'onChange'> {
    style?: React.CSSProperties;
    className?: string;
    activeKey?: string | string[];
    onChange?: (activeKey: string | string[]) => void;
}

export interface ContainerReactProps extends ElementProps<'div', 'title'>, ContainerProps {
    title?: ReactNode;
    renderHeader?: () => ReactNode;
    style?: CSSProperties;
    containerRef?: React.RefObject<HTMLDivElement>;
    children?: React.ReactNode;
    /** Attached to the `.semi-sidebar-container` div, the element `containerRef` points to; null while hidden */
    ref?: React.Ref<HTMLDivElement>;
}

export interface Option {
    icon?: ReactNode;
    name: ReactNode;
    key: string;
}

export interface OptionProps {
    activeKey?: string;
    options?: Option[];
    renderOptionItem?: (option: Option, onChange: (e: React.MouseEvent, activeKey: string) => void) => ReactNode;
    onChange?: (e: React.MouseEvent, activeKey: string) => void;
}

export type DetailContent = CodeItemProps | Omit<FileItemProps, 'editable' | 'imgUploadProps' | 'onContentChange'>;

export interface SideBarProps extends Omit<ContainerReactProps, 'onChange'>, Omit<OptionProps, 'onChange'> {
    mode?: string; // main, code, file or a custom mode
    detailContent?: DetailContent;
    onActiveOptionChange?: (e: React.MouseEvent, activeKey: string) => void;
    renderMainContent?: (activeKey: string) => ReactNode;
    renderDetailHeader?: (mode: string, detailContent?: DetailContent) => ReactNode;
    renderDetailContent?: (mode: string) => ReactNode;
    fileEditable?: boolean;
    onFileContentChange?: (content: string) => void;
    onBackWard?: (e: React.MouseEvent, mode: string) => void | Promise<any>;
    onDetailContentCopy?: (e: React.MouseEvent, content: string, res: boolean) => void;
    imgUploadProps?: ImageUploadNodeOptions;
}
