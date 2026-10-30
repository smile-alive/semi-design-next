import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { strings } from '@fibrae/semi-foundation/upload/constants';
import type { AfterUploadResult as FoundationAfterUploadResult, BaseFileItem, BeforeUploadObjectResult as FoundationBeforeUploadObjectResult, CustomFile } from '@fibrae/semi-foundation/upload/foundation';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { ValidateStatus } from '../input/interface.js';
import type { ModalProps } from '../modal/interface.js';
import type { ShowTooltip, TypographyEllipsisTooltipProps } from '../typography/interface.js';

export type { CustomFile, FileItemStatus } from '@fibrae/semi-foundation/upload/foundation';

export type PromptPositionType = ArrayElement<typeof strings.PROMPT_POSITION>;
export type UploadListType = ArrayElement<typeof strings.LIST_TYPE>;

/** A file in the list; nodes for the message go through the `fileValidateMessage` snippet */
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
export type UploadCropModalProps = Omit<ModalProps, 'visible' | 'title' | 'okText' | 'cancelText' | 'onOk' | 'onCancel' | 'children'>;

/** What every per-file snippet receives; `<UploadFileCard {...props} />` renders the default card */
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
    style?: string;
    onRemove: () => void;
    onRetry: () => void;
    onReplace: () => void;
    /** Present only when Upload has an onPreviewClick */
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

/** The snippets a card renders; Upload forwards its own of the same names to each card */
export interface FileCardSnippets {
    previewFile?: Snippet<[UploadFileItemSlotProps]>;
    thumbnail?: Snippet<[UploadFileItemSlotProps]>;
    picInfo?: Snippet<[UploadFileItemSlotProps]>;
    picPreviewIcon?: Snippet<[UploadFileItemSlotProps]>;
    picClose?: Snippet<[UploadPicCloseSlotProps]>;
    fileOperation?: Snippet<[UploadFileItemSlotProps]>;
    /** Replaces a card's validate message, which the snippet gets as `validateMessage` */
    fileValidateMessage?: Snippet<[UploadFileItemSlotProps]>;
    ellipsisTooltip?: Snippet<[TypographyEllipsisTooltipProps]>;
}

export interface UploadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'ondrop' | 'onerror' | 'onprogress' | 'children'>, FileCardSnippets {
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
    directory?: boolean;
    disabled?: boolean;
    draggable?: boolean;
    /** Bindable; the list on screen. `undefined` leaves the list to the component */
    fileList?: FileItem[];
    fileName?: string;
    headers?: Record<string, any> | ((file: File) => Record<string, string>);
    /** Where the picture wall's add button sits */
    hotSpotLocation?: 'start' | 'end';
    /** Style of each file card */
    itemStyle?: string;
    limit?: number;
    listType?: UploadListType;
    /** KB */
    maxSize?: number;
    /** KB */
    minSize?: number;
    multiple?: boolean;
    name?: string;
    picHeight?: string | number;
    picWidth?: string | number;
    promptPosition?: PromptPositionType;
    showClear?: boolean;
    showPicInfo?: boolean;
    showReplace?: boolean;
    showRetry?: boolean;
    /** Tooltip of a truncated file name; its custom popup is the `ellipsisTooltip` snippet */
    showTooltip?: boolean | ShowTooltip;
    showUploadList?: boolean;
    transformFile?: (file: File) => File;
    uploadTrigger?: 'auto' | 'custom';
    validateStatus?: ValidateStatus;
    withCredentials?: boolean;
    /** While present the cards are clickable and get a preview button */
    onPreviewClick?: (fileItem: FileItem) => void;
    /** `change` of the Upload, not the native event of the hidden input */
    onChange?: (object: UploadOnChangeProps) => void;
    onAcceptInvalid?: (files: File[]) => void;
    onClear?: () => void;
    onCropError?: (error: Error) => void;
    onDrop?: (e: DragEvent, files: File[], fileList: FileItem[]) => void;
    /** `xhr` is the object a customRequest passed to its onError */
    onError?: (e: UploadCustomError, file: CustomFile, fileList: FileItem[], xhr: XMLHttpRequest | { status?: number }) => void;
    onExceed?: (fileList: File[]) => void;
    onFileChange?: (files: File[]) => void;
    onOpenFileDialog?: () => void;
    /** A pasted clipboard file could not be read */
    onPastingError?: (error: Error) => void;
    onProgress?: (percent: number, file: CustomFile, fileList: FileItem[]) => void;
    /** `currentFile` is undefined for an item that came without its File, e.g. from an initial fileList */
    onRemove?: (currentFile: CustomFile | undefined, fileList: FileItem[], currentFileItem: FileItem) => void;
    onRetry?: (fileItem: FileItem) => void;
    onSizeError?: (file: CustomFile, fileList: FileItem[]) => void;
    onSuccess?: (responseBody: any, file: CustomFile, fileList: FileItem[]) => void;
    /** The trigger content; in draggable mode it replaces the whole default drag area content */
    children?: Snippet;
    /** Empty falls back to the default icon */
    dragIcon?: Snippet;
    /** Falls back to the locale text */
    dragMainText?: Snippet;
    dragSubText?: Snippet;
    prompt?: Snippet;
    validateMessage?: Snippet;
    /** Replaces the list title text; the clear button stays */
    fileListTitle?: Snippet;
    /** Replaces the whole list title area, clear button included */
    fileListHeader?: Snippet<[UploadFileListHeaderSlotProps]>;
    /** Replaces each card; render `UploadFileCard` in it for the default one */
    fileItem?: Snippet<[UploadFileItemSlotProps]>;
}

export interface FileCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>, FileCardSnippets {
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
    /** While present the card is clickable and gets a preview button */
    onPreviewClick?: () => void;
    onRemove?: () => void;
    onRetry?: () => void;
    onReplace?: () => void;
}
