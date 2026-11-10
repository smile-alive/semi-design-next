import { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type CSSProperties, type ChangeEvent, type DragEvent, type FocusEvent, type KeyboardEvent } from 'react';
import clsx from 'clsx';
import type { ValidateStatus } from '@fibrae/semi-foundation/base/constants';
import { strings, cssClasses } from '@fibrae/semi-foundation/components/upload/constants';
import UploadFoundation, { type CustomFile, type UploadAdapter, type UploadBaseState, type BeforeUploadObjectResult, type AfterUploadResult, type FileItemStatus } from '@fibrae/semi-foundation/components/upload/foundation';
import { addAreaControlAttributes, containsControl, containsName, ListFocusTracker } from '@fibrae/semi-foundation/components/upload/utils';
import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/components/upload/upload.scss';
import { IconUpload } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../../base/base';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import Cropper, { type CropperHandle } from '../cropper';
import useLocale from '../locale/use-locale';
import Modal from '../modal';
import type { ShowTooltip } from '../typography';
import FileCard from './file-card';
import type { FileItem, RenderFileItemProps, UploadListType, PromptPositionType, BeforeUploadProps, AfterUploadProps, OnChangeProps, customRequestArgs, CustomError, RenderPictureCloseProps, RenderFileListTitleProps, CropProps, UploadCropModalProps } from './interface';

const prefixCls = cssClasses.PREFIX;

export type { FileItem, FileItemStatus, RenderFileItemProps, UploadListType, PromptPositionType, BeforeUploadProps, AfterUploadProps, OnChangeProps, customRequestArgs, CustomError, BeforeUploadObjectResult, AfterUploadResult, RenderFileListTitleProps, CropProps };
export type { FileCardProps } from './file-card';

export interface UploadHandle {
    /** Adds files at `index`, or at the end without one */
    insert: (files: Array<CustomFile>, index?: number) => void;
    /** Uploads the files waiting for `uploadTrigger="custom"` */
    upload: () => void;
    openFileDialog: () => void;
}

export interface UploadProps extends ElementProps<'div', 'onChange' | 'onDrop' | 'onError' | 'onProgress'> {
    accept?: string;
    action: string;
    afterUpload?: (object: AfterUploadProps) => AfterUploadResult;
    beforeUpload?: (object: BeforeUploadProps) => BeforeUploadObjectResult | Promise<BeforeUploadObjectResult> | boolean;
    beforeClear?: (fileList: Array<FileItem>) => boolean | Promise<boolean>;
    beforeRemove?: (file: FileItem, fileList: Array<FileItem>) => boolean | Promise<boolean>;
    capture?: boolean | 'user' | 'environment';
    children?: ReactNode;
    className?: string;
    customRequest?: (object: customRequestArgs) => void;
    data?: Record<string, any> | ((file: File) => Record<string, unknown>);
    defaultFileList?: Array<FileItem>;
    directory?: boolean;
    disabled?: boolean;
    dragIcon?: ReactNode;
    dragMainText?: ReactNode;
    dragSubText?: ReactNode;
    draggable?: boolean;
    addOnPasting?: boolean;
    fileList?: Array<FileItem>;
    fileName?: string;
    headers?: Record<string, any> | ((file: File) => Record<string, string>);
    hotSpotLocation?: 'start' | 'end';
    itemStyle?: CSSProperties;
    limit?: number;
    listType?: UploadListType;
    maxSize?: number;
    minSize?: number;
    multiple?: boolean;
    name?: string;
    onAcceptInvalid?: (files: File[]) => void;
    onChange?: (object: OnChangeProps) => void;
    onClear?: () => void;
    onDrop?: (e: globalThis.DragEvent, files: Array<File>, fileList: Array<FileItem>) => void;
    onError?: (e: CustomError, file: CustomFile, fileList: Array<FileItem>, xhr: XMLHttpRequest | { status?: number }) => void;
    /** Called when a pasted clipboard file cannot be read (`getAsFile()` returns null or throws) */
    onPastingError?: (error: Error) => void;
    onExceed?: (fileList: Array<File>) => void;
    onFileChange?: (files: Array<File>) => void;
    onOpenFileDialog?: () => void;
    onPreviewClick?: (fileItem: FileItem) => void;
    onProgress?: (percent: number, file: CustomFile, fileList: Array<FileItem>) => void;
    onRemove?: (currentFile: CustomFile | undefined, fileList: Array<FileItem>, currentFileItem: FileItem) => void;
    onRetry?: (fileItem: FileItem) => void;
    onSizeError?: (file: CustomFile, fileList: Array<FileItem>) => void;
    onSuccess?: (responseBody: any, file: CustomFile, fileList: Array<FileItem>) => void;
    previewFile?: (renderFileItemProps: RenderFileItemProps) => ReactNode;
    prompt?: ReactNode;
    promptPosition?: PromptPositionType;
    picHeight?: string | number;
    picWidth?: string | number;
    renderFileItem?: (renderFileItemProps: RenderFileItemProps & { key: string }) => ReactNode;
    renderPicInfo?: (renderFileItemProps: RenderFileItemProps) => ReactNode;
    renderThumbnail?: (renderFileItemProps: RenderFileItemProps) => ReactNode;
    renderPicPreviewIcon?: (renderFileItemProps: RenderFileItemProps) => ReactNode;
    renderPicClose?: (renderPicCloseProps: RenderPictureCloseProps) => ReactNode;
    renderFileOperation?: (fileItem: RenderFileItemProps) => ReactNode;
    fileListTitle?: ReactNode | ((props: RenderFileListTitleProps) => ReactNode);
    showClear?: boolean;
    showPicInfo?: boolean;
    showReplace?: boolean;
    showRetry?: boolean;
    showUploadList?: boolean;
    style?: CSSProperties;
    timeout?: number;
    transformFile?: (file: File) => File;
    uploadTrigger?: 'auto' | 'custom';
    validateMessage?: ReactNode;
    validateStatus?: ValidateStatus;
    withCredentials?: boolean;
    showTooltip?: boolean | ShowTooltip;
    /** `true` uses the default crop options */
    crop?: boolean | CropProps;
    /**
     * Called once with the first selected image before the crop modal opens; its result applies to the whole batch.
     * Return `false` to skip cropping and upload directly.
     */
    beforeCrop?: (file: File, fileList: File[]) => boolean | Promise<boolean>;
    onCropError?: (error: Error) => void;
    cropModalProps?: UploadCropModalProps;
    ref?: React.Ref<UploadHandle>;
}

export interface UploadState extends UploadBaseState {
    fileList: Array<FileItem>;
}

type Foundation = UploadFoundation<UploadProps, UploadState, DragEvent<HTMLDivElement>>;
type Adapter = UploadAdapter<UploadProps, UploadState, DragEvent<HTMLDivElement>>;

const defaultProps = {
    defaultFileList: [],
    disabled: false,
    listType: 'list',
    hotSpotLocation: 'end',
    multiple: false,
    promptPosition: 'right',
    showClear: true,
    showPicInfo: false,
    showReplace: false,
    showRetry: true,
    showUploadList: true,
    uploadTrigger: 'auto',
    withCredentials: false,
    showTooltip: true,
} satisfies Partial<UploadProps>;

function openDialog(foundation: Foundation, input: HTMLInputElement | null) {
    const { disabled, onOpenFileDialog } = foundation.getProps();
    if (disabled || !input) {
        return;
    }
    input.click();
    onOpenFileDialog?.();
}

// Holds the hidden inputs and the nodes focus is handed over to: callbacks given to renderFileItem during render must
// not read refs
class UploadRuntime {
    input: HTMLInputElement | null = null;
    replaceInput: HTMLInputElement | null = null;
    addArea: HTMLElement | null = null;
    list: HTMLElement | null = null;
    listFocus = new ListFocusTracker();

    setInput(node: HTMLInputElement | null) {
        this.input = node;
    }

    setReplaceInput(node: HTMLInputElement | null) {
        this.replaceInput = node;
    }

    resetInput() {
        if (this.input) {
            this.input.value = '';
        }
    }

    resetReplaceInput() {
        if (this.replaceInput) {
            this.replaceInput.value = '';
        }
    }

    setAddArea(node: HTMLElement | null) {
        this.addArea = node;
    }

    setList(node: HTMLElement | null) {
        this.list = node;
    }

    trackFocus(node: Node) {
        this.listFocus.track(node, this.list?.children ?? []);
    }

    handoverFocus() {
        this.listFocus.restore(this.list?.children ?? [], this.addArea);
    }
}

function Upload(rawProps: UploadProps) {
    const props = useDefaultProps('Upload', rawProps, defaultProps);

    const {
        ref,
        accept,
        action,
        afterUpload,
        beforeUpload,
        beforeClear,
        beforeRemove,
        capture,
        children,
        className,
        customRequest,
        data,
        defaultFileList,
        directory,
        disabled,
        dragIcon,
        dragMainText,
        dragSubText,
        draggable,
        addOnPasting,
        fileList: fileListProp,
        fileName,
        headers,
        hotSpotLocation,
        itemStyle,
        limit,
        listType,
        maxSize,
        minSize,
        multiple,
        name,
        onAcceptInvalid,
        onChange,
        onClear,
        onDrop,
        onError,
        onPastingError,
        onExceed,
        onFileChange,
        onOpenFileDialog,
        onPreviewClick,
        onProgress,
        onRemove,
        onRetry,
        onSizeError,
        onSuccess,
        previewFile,
        prompt,
        promptPosition,
        picHeight,
        picWidth,
        renderFileItem,
        renderPicInfo,
        renderThumbnail,
        renderPicPreviewIcon,
        renderPicClose,
        renderFileOperation,
        fileListTitle,
        showClear,
        showPicInfo,
        showReplace,
        showRetry,
        showUploadList,
        style,
        timeout,
        transformFile,
        uploadTrigger,
        validateMessage,
        validateStatus,
        withCredentials,
        showTooltip,
        crop,
        beforeCrop,
        onCropError,
        cropModalProps,
        // injected by Form, not DOM attributes
        insetLabel,
        insetLabelId,
        // role="group" does not support aria-required, and a tabIndex on the root (a Tooltip around the Upload injects
        // one) would add a Tab stop beside the add button, so it goes to the add button instead
        'aria-required': ariaRequired,
        tabIndex,
        onBlur,
        ...rest
    } = props as UploadProps & { insetLabel?: unknown; insetLabelId?: unknown };

    const { locale } = useLocale('Upload');

    const cropperRef = useRef<CropperHandle>(null);
    const [runtime] = useState(() => new UploadRuntime());

    // A control inside a button is invalid nesting with two Tab stops, so when the content brings its own control it
    // is the button and its click bubbles up; observed since children may change what they render
    const [addAreaHasControl, setAddAreaHasControl] = useState(false);
    const [addAreaHasName, setAddAreaHasName] = useState(true);
    let addContent: ReactNode = null;

    const addAreaRole = addAreaHasControl ? undefined : 'button';

    // wrappers keep the runtime out of a ref position, which the React Compiler would treat as a ref
    const setInput = useCallback((node: HTMLInputElement | null) => runtime.setInput(node), [runtime]);

    const setReplaceInput = useCallback((node: HTMLInputElement | null) => runtime.setReplaceInput(node), [runtime]);

    const setList = useCallback((node: HTMLElement | null) => runtime.setList(node), [runtime]);

    const trackFocus = useCallback((e: FocusEvent<HTMLElement>) => runtime.trackFocus(e.target), [runtime]);

    const untrackFocus = useCallback((e: FocusEvent<HTMLElement>) => runtime.listFocus.untrack(e.target), [runtime]);

    const observeAddArea = useCallback(
        (node: HTMLDivElement | null) => {
            if (!node) {
                return undefined;
            }
            runtime.setAddArea(node);
            const check = () => {
                setAddAreaHasControl(containsControl(node));
                setAddAreaHasName(containsName(node));
            };
            check();
            const observer = new MutationObserver(check);
            observer.observe(node, {
                subtree: true,
                childList: true,
                characterData: true,
                attributeFilter: addAreaControlAttributes,
            });
            return () => {
                observer.disconnect();
                runtime.setAddArea(null);
            };
        },
        [runtime]
    );

    // Blur bubbles, also from the crop dialog rendered in a portal; moving between the controls inside is not leaving
    // the Upload, and a form validates on blur
    const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
        if (e.target instanceof Node && e.currentTarget.contains(e.target) && !e.currentTarget.contains(e.relatedTarget)) {
            onBlur?.(e);
        }
    };

    useLayoutEffect(() => runtime.handoverFocus());

    const [foundation, state] = useFoundation<Foundation, Adapter, UploadProps, UploadState>(
        UploadFoundation,
        props,
        () => UploadFoundation.getInitialState(props),
        (base) => ({
            notifyFileSelect: (files) => base.getProps().onFileChange?.(files),
            notifyError: (error, fileInstance, fileList, xhr) => base.getProps().onError?.(error, fileInstance, fileList, xhr),
            notifySuccess: (responseBody, file, fileList) => base.getProps().onSuccess?.(responseBody, file, fileList),
            notifyProgress: (percent, file, fileList) => base.getProps().onProgress?.(percent, file, fileList),
            notifyRemove: (file, fileList, fileItem) => base.getProps().onRemove?.(file, fileList, fileItem),
            notifySizeError: (file, fileList) => base.getProps().onSizeError?.(file, fileList),
            notifyExceed: (fileList) => base.getProps().onExceed?.(fileList),
            notifyBeforeUpload: ({ file, fileList }) => base.getProps().beforeUpload({ file, fileList }),
            notifyAfterUpload: ({ response, file, fileList }) => base.getProps().afterUpload({ response, file, fileList }),
            resetInput: () => runtime.resetInput(),
            resetReplaceInput: () => runtime.resetReplaceInput(),
            openReplacePicker: () => runtime.replaceInput?.click(),
            notifyPastingError: (error) => base.getProps().onPastingError?.(error),
            notifyCropError: (error) => base.getProps().onCropError?.(error),
            notifyChange: ({ currentFile, fileList }) => base.getProps().onChange?.({ currentFile, fileList }),
            notifyClear: () => base.getProps().onClear?.(),
            notifyPreviewClick: (file) => base.getProps().onPreviewClick?.(file),
            notifyRetry: (fileItem) => base.getProps().onRetry?.(fileItem),
            notifyDrop: (e, files, fileList) => base.getProps().onDrop?.(e.nativeEvent, files, fileList),
            notifyAcceptInvalid: (invalidFiles) => base.getProps().onAcceptInvalid?.(invalidFiles),
            notifyBeforeRemove: (file, fileList) => base.getProps().beforeRemove?.(file, fileList) ?? true,
            notifyBeforeClear: (fileList) => base.getProps().beforeClear?.(fileList) ?? true,
            getCropperCanvas: () => cropperRef.current?.getCropperCanvas() ?? null,
        })
    );

    const fileList = fileListProp === undefined ? state.fileList : fileListProp || [];
    const { dragAreaStatus } = state;

    const dragHandlers = {
        onDrop: (e: DragEvent<HTMLDivElement>) => foundation.handleDrop(e),
        onDragOver: (e: DragEvent<HTMLDivElement>) => foundation.handleDragOver(e),
        onDragLeave: (e: DragEvent<HTMLDivElement>) => foundation.handleDragLeave(e),
        onDragEnter: (e: DragEvent<HTMLDivElement>) => foundation.handleDragEnter(e),
    };

    const openFileDialog = () => openDialog(foundation, runtime.input);

    const addAreaProps = addAreaHasControl
        ? { ref: observeAddArea }
        : {
              ref: observeAddArea,
              tabIndex: props.tabIndex ?? 0,
              'aria-disabled': props.disabled,
              'aria-label': addAreaHasName ? undefined : locale.upload,
              onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault(); // Space would scroll the page
                      openFileDialog();
                  }
              },
          };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => foundation.addFiles(e.target.files);

    const handleReplaceChange = (e: ChangeEvent<HTMLInputElement>) => foundation.handleReplaceChange(e.target.files);

    const renderFile = (file: FileItem, index: number): ReactNode => {
        const { name: fileName, uid } = file;
        const fileCardProps = {
            showRetry,
            showReplace,
            ...file,
            validateMessage: UploadFoundation.getFallbackValidateMessage(file, locale) ?? file.validateMessage,
            previewFile,
            listType,
            onRemove: () => foundation.handleRemove(file),
            onRetry: () => foundation.retry(file),
            index,
            key: uid || `${fileName}${index}`,
            style: itemStyle,
            disabled,
            showPicInfo,
            renderPicInfo,
            renderPicPreviewIcon,
            renderPicClose,
            renderFileOperation,
            renderThumbnail,
            onReplace: () => foundation.startReplace(file.uid),
            onPreviewClick: typeof onPreviewClick !== 'undefined' ? () => foundation.handlePreviewClick(file) : undefined,
            picWidth,
            picHeight,
            showTooltip,
        };

        if (typeof renderFileItem === 'undefined') {
            // the jsx runtime wants key outside spread props
            const { key, ...cardProps } = fileCardProps;
            return <FileCard key={key} {...cardProps} />;
        }
        return renderFileItem(fileCardProps);
    };

    const renderFileListPic = (): ReactNode => {
        const showAddTriggerInList = limit === undefined || limit > fileList.length;
        const dragAreaBaseCls = `${prefixCls}-drag-area`;
        const uploadAddCls = clsx(`${prefixCls}-add`, {
            [`${prefixCls}-picture-add`]: true,
            [`${prefixCls}-picture-add-disabled`]: disabled,
        });
        const addContent = (
            <div
                className={
                    draggable
                        ? clsx(uploadAddCls, {
                              [`${dragAreaBaseCls}-legal`]: dragAreaStatus === strings.DRAG_AREA_LEGAL,
                          })
                        : uploadAddCls
                }
                style={{ height: picHeight, width: picWidth }}
                role={addAreaRole}
                {...addAreaProps}
                onClick={openFileDialog}
                {...(draggable ? dragHandlers : {})}
                x-semi-prop="children"
            >
                {children}
            </div>
        );

        if (!showUploadList) {
            return showAddTriggerInList ? addContent : null;
        }

        // The wrappers stay when the list is empty, so adding the first file keeps the add button mounted and focused
        return (
            <div className={clsx(`${prefixCls}-file-list`, `${prefixCls}-picture-file-list`)} onBlur={untrackFocus} onFocus={trackFocus}>
                <div className={`${prefixCls}-file-list-main`}>
                    {showAddTriggerInList && hotSpotLocation === 'start' && addContent}
                    {/* a list owns only its items, so the add button sits beside it; display: contents keeps the
                        pictures and the button in one wrapping row */}
                    {fileList.length > 0 && (
                        <div ref={setList} className={`${prefixCls}-picture-list`} aria-label={locale.pictureList} role="list">
                            {fileList.map(renderFile)}
                        </div>
                    )}
                    {showAddTriggerInList && hotSpotLocation === 'end' && addContent}
                </div>
            </div>
        );
    };

    const renderFileListDefault = (): ReactNode => {
        if (!showUploadList || !fileList.length) {
            return null;
        }
        const titleCls = `${prefixCls}-file-list-title`;
        const showTitle = limit !== 1 && fileList.length;
        let titleContent: ReactNode;
        if (typeof fileListTitle === 'function') {
            titleContent = fileListTitle({ fileList, onClear: foundation.handleClear, clearText: locale.clear });
        } else {
            titleContent = (
                <>
                    <span className={`${titleCls}-choosen`}>{fileListTitle || locale.selectedFiles}</span>
                    {showClear && !disabled && (
                        <button type="button" className={`${titleCls}-clear`} onClick={foundation.handleClear}>
                            {locale.clear}
                        </button>
                    )}
                </>
            );
        }
        return (
            <div className={`${prefixCls}-file-list`} onBlur={untrackFocus} onFocus={trackFocus}>
                {Boolean(showTitle) && <div className={titleCls}>{titleContent}</div>}
                <div ref={setList} className={`${prefixCls}-file-list-main`} aria-label={locale.fileList} role="list">
                    {fileList.map(renderFile)}
                </div>
            </div>
        );
    };

    const renderDragArea = (): ReactNode => {
        const dragAreaBaseCls = `${prefixCls}-drag-area`;
        const dragAreaCls = clsx(dragAreaBaseCls, {
            [`${dragAreaBaseCls}-legal`]: dragAreaStatus === strings.DRAG_AREA_LEGAL,
            [`${dragAreaBaseCls}-custom`]: children,
        });
        return (
            <div className={dragAreaCls} role={addAreaRole} {...addAreaProps} {...dragHandlers} onClick={openFileDialog}>
                {children || (
                    <>
                        <div className={`${dragAreaBaseCls}-icon`} x-semi-prop="dragIcon">
                            {dragIcon || <IconUpload size="extra-large" />}
                        </div>
                        <div className={`${dragAreaBaseCls}-text`}>
                            <div className={`${dragAreaBaseCls}-main-text`} x-semi-prop="dragMainText">
                                {dragMainText || locale.mainText}
                            </div>
                            <div className={`${dragAreaBaseCls}-sub-text`} x-semi-prop="dragSubText">
                                {dragSubText}
                            </div>
                            <div className={`${dragAreaBaseCls}-tips`}>{dragAreaStatus === strings.DRAG_AREA_LEGAL && <span className={`${dragAreaBaseCls}-tips-legal`}>{locale.legalTips}</span>}</div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    useImperativeHandle(
        props.ref,
        () => ({
            insert: foundation.insertFileToList,
            upload: foundation.manualUpload,
            openFileDialog: () => openDialog(foundation, runtime.input),
        }),
        [foundation, runtime]
    );

    if (listType !== strings.FILE_LIST_PIC) {
        addContent = draggable ? (
            renderDragArea()
        ) : (
            <div className={`${prefixCls}-add`} role={addAreaRole} {...addAreaProps} onClick={openFileDialog}>
                {children}
            </div>
        );
    }

    let fileListNode: ReactNode = null;

    if (listType === strings.FILE_LIST_PIC) {
        fileListNode = renderFileListPic();
    } else if (listType === strings.FILE_LIST_DEFAULT) {
        fileListNode = renderFileListDefault();
    }

    const cropConfig: CropProps = typeof crop === 'object' ? crop : {};
    const { style: modalStyle, bodyStyle: modalBodyStyle, ...restModalProps } = cropModalProps || {};

    const uploadCls = clsx(
        prefixCls,
        {
            [`${prefixCls}-picture`]: listType === strings.FILE_LIST_PIC,
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-default`]: validateStatus === 'default',
            [`${prefixCls}-error`]: validateStatus === 'error',
            [`${prefixCls}-warning`]: validateStatus === 'warning',
            [`${prefixCls}-success`]: validateStatus === 'success',
        },
        className
    );

    const dirProps = directory ? { directory: 'directory', webkitdirectory: 'webkitdirectory' } : {};

    return (
        <div role={namedRole(rest)} {...rest} className={uploadCls} style={style} x-prompt-pos={promptPosition} onBlur={handleBlur}>
            <input ref={setInput} type="file" className={`${prefixCls}-hidden-input`} tabIndex={-1} autoComplete="off" multiple={multiple} accept={accept} capture={capture} onChange={handleChange} {...dirProps} />
            <input ref={setReplaceInput} type="file" className={`${prefixCls}-hidden-input-replace`} tabIndex={-1} autoComplete="off" multiple={false} accept={accept} onChange={handleReplaceChange} />
            {addContent}
            {Boolean(prompt) && (
                <div className={`${prefixCls}-prompt`} x-semi-prop="prompt">
                    {prompt}
                </div>
            )}
            {Boolean(validateMessage) && (
                <div className={`${prefixCls}-validate-message`} x-semi-prop="validateMessage">
                    {validateMessage}
                </div>
            )}
            {fileListNode}
            <Modal
                {...restModalProps}
                bodyStyle={{ height: 400, ...modalBodyStyle }}
                style={{ height: 500, ...modalStyle }}
                title={cropConfig.modalTitle || locale.cropTitle}
                cancelText={cropConfig.modalCancelText}
                okText={cropConfig.modalOkText}
                visible={state.cropperVisible}
                width={restModalProps.width ?? 600}
                onCancel={foundation.cancelCrop}
                onOk={foundation.confirmCrop}
            >
                {/* a new image mounts a new Cropper: a reused one would keep the zoom of the previous image */}
                {state.cropperSrc && (
                    <Cropper key={state.cropperSrc} ref={cropperRef} style={{ width: '100%', height: '100%' }} aspectRatio={cropConfig.aspectRatio} fill={cropConfig.fill} maxZoom={cropConfig.maxZoom} minZoom={cropConfig.minZoom} shape={cropConfig.shape || 'rect'} src={state.cropperSrc} zoomStep={cropConfig.zoomStep} />
                )}
            </Modal>
        </div>
    );
}

export default Object.assign(Upload, { FileCard });
