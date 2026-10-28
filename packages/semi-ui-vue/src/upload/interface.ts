import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { strings } from '@fibrae/semi-foundation/upload/constants';
import type { AfterUploadResult as FoundationAfterUploadResult, BaseFileItem, BeforeUploadObjectResult as FoundationBeforeUploadObjectResult, CustomFile } from '@fibrae/semi-foundation/upload/foundation';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { ValidateStatus } from '../input/interface';
import type { ModalProps } from '../modal/interface';
import type { ShowTooltip, TypographyEllipsisTooltipProps } from '../typography/interface';

export type { CustomFile, FileItemStatus } from '@fibrae/semi-foundation/upload/foundation';

export type PromptPositionType = ArrayElement<typeof strings.PROMPT_POSITION>;
export type UploadListType = ArrayElement<typeof strings.LIST_TYPE>;

/** A file in the list; nodes for the message go through the `fileValidateMessage` slot */
export interface FileItem extends Omit<BaseFileItem, 'validateMessage'> {
    validateMessage?: string;
}

export interface BeforeUploadProps {
    file: FileItem;
    fileList: FileItem[];
}

export interface AfterUploadProps {
    file: FileItem;
    fileList: FileItem[];
    response: any;
}

export interface BeforeUploadObjectResult extends Omit<FoundationBeforeUploadObjectResult, 'validateMessage'> {
    validateMessage?: string;
}

export interface AfterUploadResult extends Omit<FoundationAfterUploadResult, 'validateMessage'> {
    validateMessage?: string;
}

/** `currentFile` is null after `insert` and absent after a clear */
export interface UploadOnChangeProps {
    fileList: FileItem[];
    currentFile?: FileItem | null;
}

export interface UploadCustomRequestArgs {
    fileName: string;
    /** The resolved `data` prop */
    data: Record<string, any>;
    file: FileItem;
    fileInstance: File;
    /** Call while uploading with an event that has `total` and `loaded` */
    onProgress: (e?: { total: number; loaded: number }) => any;
    onError: (userXhr: { status?: number }, e?: Event) => any;
    onSuccess: (response: any, e?: Event) => any;
    withCredentials: boolean;
    action: string;
}

export interface UploadCustomError extends Error {
    status: number;
    method: string;
    url: string;
}

export interface UploadCropProps {
    /** Crop box aspect ratio (width / height), e.g. 16/9, 1, 4/3 */
    aspectRatio?: number;
    shape?: 'rect' | 'round' | 'roundRect';
    minZoom?: number;
    maxZoom?: number;
    zoomStep?: number;
    /** Output image quality, range 0 - 1, defaults to 0.92 */
    quality?: number;
    /** Fill color of the area outside the cropped region */
    fill?: string;
    /** Title of the crop modal; the locale's by default */
    modalTitle?: string;
    modalOkText?: string;
    modalCancelText?: string;
}

/** Props of the crop Modal; the visibility, title, button texts and handlers belong to Upload */
export type UploadCropModalProps = Omit<ModalProps, 'visible' | 'title' | 'okText' | 'cancelText' | 'onOk' | 'onCancel'> & {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
};

/** What every per-file slot receives; `<Upload.FileCard v-bind="props" />` renders the default card */
export interface UploadFileItemSlotProps {
    file: FileItem;
    index?: number;
    listType: UploadListType;
    disabled?: boolean;
    showRetry?: boolean;
    showReplace?: boolean;
    showPicInfo?: boolean;
    showTooltip?: boolean | ShowTooltip;
    picWidth?: string | number;
    picHeight?: string | number;
    validateMessage?: string;
    style?: StyleValue;
    onRemove: () => void;
    onRetry: () => void;
    onReplace: () => void;
    /** Present only when Upload has a previewClick listener */
    onPreviewClick?: () => void;
}

export interface UploadPicCloseSlotProps {
    class: string;
    onRemove: (e: MouseEvent) => void;
}

export interface UploadFileListHeaderSlotProps {
    fileList: FileItem[];
    onClear: () => void;
    clearText: string;
}

export interface UploadHandle {
    /** Adds files at `index`, or at the end without one */
    insert: (files: CustomFile[], index?: number) => void;
    /** Uploads the files waiting for `uploadTrigger="custom"` */
    upload: () => void;
    openFileDialog: () => void;
}

export interface UploadProps {
    accept?: string;
    action: string;
    /** Adds the files pasted anywhere on the page */
    addOnPasting?: boolean;
    afterUpload?: (object: AfterUploadProps) => AfterUploadResult;
    beforeClear?: (fileList: FileItem[]) => boolean | Promise<boolean>;
    /**
     * Called once, with the first selected image, before the crop modal opens; its result decides cropping for the
     * whole batch. `false` (or a Promise resolving to it) uploads without cropping.
     */
    beforeCrop?: (file: File, fileList: File[]) => boolean | Promise<boolean>;
    beforeRemove?: (file: FileItem, fileList: FileItem[]) => boolean | Promise<boolean>;
    beforeUpload?: (object: BeforeUploadProps) => BeforeUploadObjectResult | Promise<BeforeUploadObjectResult> | boolean;
    capture?: boolean | 'user' | 'environment';
    /** `true` crops with the defaults; an object configures the cropper */
    crop?: boolean | UploadCropProps;
    cropModalProps?: UploadCropModalProps;
    /** Replaces the built-in XMLHttpRequest */
    customRequest?: (object: UploadCustomRequestArgs) => void;
    data?: Record<string, any> | ((file: File) => Record<string, unknown>);
    defaultFileList?: FileItem[];
    directory?: boolean;
    disabled?: boolean;
    draggable?: boolean;
    /** Controlled list, for `v-model:fileList` */
    fileList?: FileItem[];
    fileName?: string;
    headers?: Record<string, any> | ((file: File) => Record<string, string>);
    /** Where the picture wall's add button sits */
    hotSpotLocation?: 'start' | 'end';
    itemStyle?: StyleValue;
    limit?: number;
    listType?: UploadListType;
    /** KB */
    maxSize?: number;
    /** KB */
    minSize?: number;
    multiple?: boolean;
    name?: string;
    /** Listened to as `@previewClick`; while present the cards are clickable and get a preview button */
    onPreviewClick?: (fileItem: FileItem) => void;
    picHeight?: string | number;
    picWidth?: string | number;
    promptPosition?: PromptPositionType;
    showClear?: boolean;
    showPicInfo?: boolean;
    showReplace?: boolean;
    showRetry?: boolean;
    /** Tooltip of a truncated file name; its custom popup is the `ellipsisTooltip` slot */
    showTooltip?: boolean | ShowTooltip;
    showUploadList?: boolean;
    transformFile?: (file: File) => File;
    uploadTrigger?: 'auto' | 'custom';
    validateStatus?: ValidateStatus;
    withCredentials?: boolean;
}

export interface UploadEmits {
    'update:fileList': [fileList: FileItem[]];
    acceptInvalid: [files: File[]];
    change: [object: UploadOnChangeProps];
    clear: [];
    cropError: [error: Error];
    drop: [e: DragEvent, files: File[], fileList: FileItem[]];
    /** `xhr` is the object a customRequest passed to its onError */
    error: [e: UploadCustomError, file: CustomFile, fileList: FileItem[], xhr: XMLHttpRequest | { status?: number }];
    exceed: [fileList: File[]];
    fileChange: [files: File[]];
    openFileDialog: [];
    /** A pasted clipboard file could not be read */
    pastingError: [error: Error];
    progress: [percent: number, file: CustomFile, fileList: FileItem[]];
    /** `currentFile` is undefined for an item that came without its File, e.g. from defaultFileList */
    remove: [currentFile: CustomFile | undefined, fileList: FileItem[], currentFileItem: FileItem];
    retry: [fileItem: FileItem];
    sizeError: [file: CustomFile, fileList: FileItem[]];
    success: [responseBody: any, file: CustomFile, fileList: FileItem[]];
}

export interface UploadSlots {
    /** The trigger content; in draggable mode it replaces the whole default drag area content */
    default?: () => VNode[];
    /** Empty falls back to the default icon */
    dragIcon?: () => VNode[];
    /** Empty falls back to the locale text */
    dragMainText?: () => VNode[];
    dragSubText?: () => VNode[];
    prompt?: () => VNode[];
    validateMessage?: () => VNode[];
    /** Replaces the list title text; the clear button stays */
    fileListTitle?: () => VNode[];
    /** Replaces the whole list title area, clear button included */
    fileListHeader?: (props: UploadFileListHeaderSlotProps) => VNode[];
    /** Replaces each card; a file it renders nothing for is not shown */
    fileItem?: (props: UploadFileItemSlotProps) => VNode[];
    previewFile?: (props: UploadFileItemSlotProps) => VNode[];
    thumbnail?: (props: UploadFileItemSlotProps) => VNode[];
    picInfo?: (props: UploadFileItemSlotProps) => VNode[];
    picPreviewIcon?: (props: UploadFileItemSlotProps) => VNode[];
    picClose?: (props: UploadPicCloseSlotProps) => VNode[];
    fileOperation?: (props: UploadFileItemSlotProps) => VNode[];
    /** Replaces a card's validate message; empty falls back to the message text */
    fileValidateMessage?: (props: UploadFileItemSlotProps) => VNode[];
    ellipsisTooltip?: (props: TypographyEllipsisTooltipProps) => VNode[];
}

export interface FileCardProps {
    file: FileItem;
    index?: number;
    listType?: UploadListType;
    disabled?: boolean;
    /** The file's own `showRetry` wins */
    showRetry?: boolean;
    /** The file's own `showReplace` wins */
    showReplace?: boolean;
    showPicInfo?: boolean;
    showTooltip?: boolean | ShowTooltip;
    picWidth?: string | number;
    picHeight?: string | number;
    /** Wins over `file.validateMessage` */
    validateMessage?: string;
    /** Listened to as `@previewClick`; while present the card is clickable and gets a preview button */
    onPreviewClick?: () => void;
}

export interface FileCardEmits {
    remove: [];
    retry: [];
    replace: [];
}

export interface FileCardSlots {
    previewFile?: (props: UploadFileItemSlotProps) => VNode[];
    thumbnail?: (props: UploadFileItemSlotProps) => VNode[];
    picInfo?: (props: UploadFileItemSlotProps) => VNode[];
    picPreviewIcon?: (props: UploadFileItemSlotProps) => VNode[];
    picClose?: (props: UploadPicCloseSlotProps) => VNode[];
    fileOperation?: (props: UploadFileItemSlotProps) => VNode[];
    /** Empty falls back to the message text */
    validateMessage?: (props: UploadFileItemSlotProps) => VNode[];
    ellipsisTooltip?: (props: TypographyEllipsisTooltipProps) => VNode[];
}
