import type { JSX } from 'solid-js';
import type { strings } from '@fibrae/semi-foundation/upload/constants';
import type { BaseFileItem, AfterUploadResult as FoundationAfterUploadResult, BeforeUploadObjectResult as FoundationBeforeUploadObjectResult } from '@fibrae/semi-foundation/upload/foundation';
import type { ModalProps } from '../modal';
import type { ShowTooltip } from '../typography/interface';

export type PromptPositionType = (typeof strings.PROMPT_POSITION)[number];
export type UploadListType = (typeof strings.LIST_TYPE)[number];

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

/** A file in the list; nodes for its message go through `renderValidateMessage` */
export interface FileItem extends Omit<BaseFileItem, 'validateMessage'> {
    validateMessage?: string;
}

export interface BeforeUploadObjectResult extends Omit<FoundationBeforeUploadObjectResult, 'validateMessage'> {
    validateMessage?: string;
}

export interface AfterUploadResult extends Omit<FoundationAfterUploadResult, 'validateMessage'> {
    validateMessage?: string;
}

export interface RenderFileItemProps extends FileItem {
    index?: number;
    previewFile?: (fileItem: RenderFileItemProps) => JSX.Element;
    listType?: UploadListType;
    onRemove?: () => void;
    onRetry?: () => void;
    onReplace?: () => void;
    showPicInfo?: boolean;
    renderPicInfo?: (renderFileItemProps: RenderFileItemProps) => JSX.Element;
    renderPicPreviewIcon?: (renderFileItemProps: RenderFileItemProps) => JSX.Element;
    renderPicClose?: (renderPicCloseProps: RenderPictureCloseProps) => JSX.Element;
    renderThumbnail?: (renderFileItemProps: RenderFileItemProps) => JSX.Element;
    renderFileOperation?: (fileItem: RenderFileItemProps) => JSX.Element;
    /** Empty content falls back to the message text; the picture wall shows its icon only for a file with a message */
    renderValidateMessage?: (fileItem: RenderFileItemProps) => JSX.Element;
    showRetry?: boolean;
    showReplace?: boolean;
    /** Merged with `picWidth` and `picHeight` in the picture wall, so only an object */
    style?: JSX.CSSProperties;
    disabled?: boolean;
    onPreviewClick?: () => void;
    picWidth?: string | number;
    picHeight?: string | number;
    showTooltip?: boolean | ShowTooltip;
}

export interface RenderPictureCloseProps {
    class: string;
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
export interface UploadCropModalProps extends Omit<ModalProps, 'visible' | 'title' | 'okText' | 'cancelText' | 'onOk' | 'onCancel' | 'style' | 'bodyStyle'> {
    /** Merged over the default height, so only an object */
    style?: JSX.CSSProperties;
    /** Merged over the default height, so only an object */
    bodyStyle?: JSX.CSSProperties;
}
