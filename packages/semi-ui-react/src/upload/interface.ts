import type { ReactNode, CSSProperties, MouseEvent } from 'react';
import type { strings } from '@fibrae/semi-foundation/upload/constants';
import type { BaseFileItem } from '@fibrae/semi-foundation/upload/foundation';
import type { ArrayElement } from '../_base/base';
import type { ModalReactProps } from '../modal';
import type { ShowTooltip } from '../typography';

export type PromptPositionType = ArrayElement<typeof strings.PROMPT_POSITION>;
export type UploadListType = ArrayElement<typeof strings.LIST_TYPE>;

export interface BeforeUploadProps {
    file: FileItem;
    fileList: Array<FileItem>;
}

export interface AfterUploadProps {
    file: FileItem;
    fileList: Array<FileItem>;
    response: any;
}

export interface OnChangeProps {
    fileList: Array<FileItem>;
    currentFile?: FileItem | null;
}

export interface customRequestArgs {
    fileName: string;
    data: Record<string, any>;
    file: FileItem;
    fileInstance: File;
    onProgress: (e?: { total: number; loaded: number }) => any;
    onError: (userXhr: { status?: number }, e?: Event) => any;
    onSuccess: (response: any, e?: Event) => any;
    withCredentials: boolean;
    action: string;
}

export interface CustomError extends Error {
    status: number;
    method: string;
    url: string;
}

export interface FileItem extends BaseFileItem {
    validateMessage?: ReactNode;
}

export interface RenderFileItemProps extends FileItem {
    index?: number;
    previewFile?: (fileItem: RenderFileItemProps) => ReactNode;
    listType?: UploadListType;
    onRemove?: () => void;
    onRetry?: () => void;
    onReplace?: () => void;
    showPicInfo?: boolean;
    renderPicInfo?: (renderFileItemProps: RenderFileItemProps) => ReactNode;
    renderPicPreviewIcon?: (renderFileItemProps: RenderFileItemProps) => ReactNode;
    renderPicClose?: (renderPicCloseProps: RenderPictureCloseProps) => ReactNode;
    renderThumbnail?: (renderFileItemProps: RenderFileItemProps) => ReactNode;
    renderFileOperation?: (fileItem: RenderFileItemProps) => ReactNode;
    showRetry?: boolean;
    showReplace?: boolean;
    style?: CSSProperties;
    disabled?: boolean;
    onPreviewClick?: () => void;
    picWidth?: string | number;
    picHeight?: string | number;
    showTooltip?: boolean | ShowTooltip;
}

export interface RenderPictureCloseProps {
    className: string;
    remove: (e: MouseEvent) => void;
}

export interface RenderFileListTitleProps {
    fileList: Array<FileItem>;
    onClear: () => void;
    clearText: string;
}

export interface CropProps {
    /** Width / height, e.g. 16/9 */
    aspectRatio?: number;
    /** Crop box shape */
    shape?: 'rect' | 'round' | 'roundRect';
    /** Minimum zoom ratio */
    minZoom?: number;
    /** Maximum zoom ratio */
    maxZoom?: number;
    /** Zoom step size */
    zoomStep?: number;
    /** Output quality, 0 - 1 @default 0.92 */
    quality?: number;
    /** Fill color outside the cropped region */
    fill?: string;
    /** Overrides the locale text */
    modalTitle?: string;
    /** Overrides the locale text */
    modalOkText?: string;
    /** Overrides the locale text */
    modalCancelText?: string;
}

/** Props of the crop Modal; the visibility, title, button texts and handlers belong to Upload */
export type UploadCropModalProps = Omit<ModalReactProps, 'visible' | 'title' | 'okText' | 'cancelText' | 'onOk' | 'onCancel'>;
