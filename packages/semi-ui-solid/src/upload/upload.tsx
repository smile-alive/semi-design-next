import { type Accessor, Index, type JSX, type Ref, Show, children, createEffect, createMemo, createRenderEffect, mergeProps, on, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/upload/constants';
import UploadFoundation, { type CustomFile, type UploadAdapter, type UploadBaseState } from '@fibrae/semi-foundation/upload/foundation';
import { ListFocusTracker } from '@fibrae/semi-foundation/upload/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/upload/upload.scss';
import { IconUpload } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useEventListener from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import Cropper, { type CropperHandle } from '../cropper';
import type { ValidateStatus } from '../input';
import useLocale from '../locale/use-locale';
import Modal from '../modal';
import { useSpecialTrigger } from '../tooltip/context';
import type { ShowTooltip } from '../typography/interface';
import AddArea from './add-area';
import { type AddAreaContextValue, AddAreaContext } from './context';
import FileCard from './file-card';
import type { AfterUploadProps, AfterUploadResult, BeforeUploadObjectResult, BeforeUploadProps, CropProps, CustomError, FileItem, OnChangeProps, PromptPositionType, RenderFileItemProps, RenderFileListTitleProps, RenderPictureCloseProps, UploadCropModalProps, UploadListType, customRequestArgs } from './interface';

// namedRole yields a plain string, which the typed role attribute does not accept
type Role = JSX.HTMLAttributes<HTMLDivElement>['role'];

export interface UploadHandle {
    /** Adds files at `index`, or at the end without one */
    insert: (files: Array<CustomFile>, index?: number) => void;
    /** Uploads the files waiting for `uploadTrigger="custom"` */
    upload: () => void;
    /** Opens the file dialog */
    openFileDialog: () => void;
}

export type UploadElement = HTMLDivElement & UploadHandle;

export interface UploadProps extends ElementProps<'div', 'onChange' | 'onDrop' | 'onError' | 'onProgress' | 'ref'> {
    accept?: string;
    action: string;
    afterUpload?: (object: AfterUploadProps) => AfterUploadResult;
    beforeUpload?: (object: BeforeUploadProps) => BeforeUploadObjectResult | Promise<BeforeUploadObjectResult> | boolean;
    beforeClear?: (fileList: Array<FileItem>) => boolean | Promise<boolean>;
    beforeRemove?: (file: FileItem, fileList: Array<FileItem>) => boolean | Promise<boolean>;
    capture?: boolean | 'user' | 'environment';
    children?: JSX.Element;
    customRequest?: (object: customRequestArgs) => void;
    data?: Record<string, any> | ((file: File) => Record<string, unknown>);
    defaultFileList?: Array<FileItem>;
    directory?: boolean;
    disabled?: boolean;
    dragIcon?: JSX.Element;
    dragMainText?: JSX.Element;
    dragSubText?: JSX.Element;
    draggable?: boolean;
    addOnPasting?: boolean;
    fileList?: Array<FileItem>;
    fileName?: string;
    headers?: Record<string, any> | ((file: File) => Record<string, string>);
    hotSpotLocation?: 'start' | 'end';
    /** Merged with `picWidth` and `picHeight` in the picture wall, so only an object */
    itemStyle?: JSX.CSSProperties;
    limit?: number;
    listType?: UploadListType;
    maxSize?: number;
    minSize?: number;
    multiple?: boolean;
    name?: string;
    onAcceptInvalid?: (files: File[]) => void;
    onChange?: (object: OnChangeProps) => void;
    onClear?: () => void;
    onDrop?: (e: DragEvent, files: Array<File>, fileList: Array<FileItem>) => void;
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
    previewFile?: (renderFileItemProps: RenderFileItemProps) => JSX.Element;
    prompt?: JSX.Element;
    promptPosition?: PromptPositionType;
    picHeight?: string | number;
    picWidth?: string | number;
    renderFileItem?: (renderFileItemProps: RenderFileItemProps) => JSX.Element;
    renderPicInfo?: (renderFileItemProps: RenderFileItemProps) => JSX.Element;
    renderThumbnail?: (renderFileItemProps: RenderFileItemProps) => JSX.Element;
    renderPicPreviewIcon?: (renderFileItemProps: RenderFileItemProps) => JSX.Element;
    renderPicClose?: (renderPicCloseProps: RenderPictureCloseProps) => JSX.Element;
    renderFileOperation?: (fileItem: RenderFileItemProps) => JSX.Element;
    /** A card's validate message; empty content falls back to the message text */
    renderValidateMessage?: (fileItem: RenderFileItemProps) => JSX.Element;
    fileListTitle?: JSX.Element | ((props: RenderFileListTitleProps) => JSX.Element);
    showClear?: boolean;
    showPicInfo?: boolean;
    showReplace?: boolean;
    showRetry?: boolean;
    showUploadList?: boolean;
    timeout?: number;
    transformFile?: (file: File) => File;
    uploadTrigger?: 'auto' | 'custom';
    validateMessage?: JSX.Element;
    validateStatus?: ValidateStatus;
    withCredentials?: boolean;
    showTooltip?: boolean | ShowTooltip;
    /** Enables image cropping; `true` uses defaults */
    crop?: boolean | CropProps;
    /**
     * Called once with the first selected image before the crop modal opens; its result applies to the whole batch.
     * Return `false` to skip cropping and upload directly.
     */
    beforeCrop?: (file: File, fileList: File[]) => boolean | Promise<boolean>;
    /** Called when cropping fails */
    onCropError?: (error: Error) => void;
    /** Extra props for the crop Modal */
    cropModalProps?: UploadCropModalProps;
    /** The root element with the UploadHandle methods */
    ref?: Ref<UploadElement>;
}

interface UploadState extends UploadBaseState {
    dragAreaStatus: 'default' | 'legal';
    fileList: Array<FileItem>;
}

type Foundation = UploadFoundation<UploadProps, UploadState, DragEvent>;
type Adapter = UploadAdapter<UploadProps, UploadState, DragEvent>;
type TitleRender = (props: RenderFileListTitleProps) => JSX.Element;

const prefixCls = cssClasses.PREFIX;
const dragAreaCls = `${prefixCls}-drag-area`;

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

export default function Upload(rawProps: UploadProps) {
    const props = useDefaultProps('Upload', rawProps, defaultProps);

    const [local, rest] = splitProps(omitFormInjected(props), [
        'ref',
        'accept',
        'action',
        'afterUpload',
        'beforeUpload',
        'beforeClear',
        'beforeRemove',
        'capture',
        'children',
        'class',
        'customRequest',
        'data',
        'defaultFileList',
        'directory',
        'disabled',
        'dragIcon',
        'dragMainText',
        'dragSubText',
        'draggable',
        'addOnPasting',
        'fileList',
        'fileName',
        'headers',
        'hotSpotLocation',
        'itemStyle',
        'limit',
        'listType',
        'maxSize',
        'minSize',
        'multiple',
        'name',
        'onAcceptInvalid',
        'onChange',
        'onClear',
        'onDrop',
        'onError',
        'onPastingError',
        'onExceed',
        'onFileChange',
        'onOpenFileDialog',
        'onPreviewClick',
        'onProgress',
        'onRemove',
        'onRetry',
        'onSizeError',
        'onSuccess',
        'previewFile',
        'prompt',
        'promptPosition',
        'picHeight',
        'picWidth',
        'renderFileItem',
        'renderPicInfo',
        'renderThumbnail',
        'renderPicPreviewIcon',
        'renderPicClose',
        'renderFileOperation',
        'renderValidateMessage',
        'fileListTitle',
        'showClear',
        'showPicInfo',
        'showReplace',
        'showRetry',
        'showUploadList',
        'timeout',
        'transformFile',
        'uploadTrigger',
        'validateMessage',
        'withCredentials',
        'showTooltip',
        'crop',
        'beforeCrop',
        'onCropError',
        'cropModalProps',
        // role="group" does not support aria-required, and a tabIndex on the root (a Tooltip around the Upload injects
        // one) would add a Tab stop beside the add button, so it goes to the add button instead
        'aria-required',
        'tabIndex',
        'onBlur',
        'onFocusOut',
    ]);

    const locale = useLocale('Upload');

    let root!: HTMLDivElement;
    let input: HTMLInputElement | undefined;
    let replaceInput: HTMLInputElement | undefined;
    let addArea: HTMLDivElement | undefined;
    let cropper: CropperHandle | undefined;
    const listFocus = new ListFocusTracker();

    const { foundation, state } = useFoundation<Foundation, Adapter, UploadProps, UploadState>(
        UploadFoundation,
        props,
        () => ({
            fileList: props.defaultFileList ?? [],
            replaceUid: '',
            dragAreaStatus: 'default',
            cropperVisible: false,
            cropperFile: null,
            cropperSrc: '',
            pendingImageFiles: [],
            nonImageFiles: [],
            croppedFiles: [],
            isReplaceOperation: false,
        }),
        (base) => ({
            notifyFileSelect: (files) => base.getProps().onFileChange?.(files),
            notifyError: (error, fileInstance, fileList, xhr) => base.getProps().onError?.(error, fileInstance, fileList, xhr),
            notifySuccess: (responseBody, file, fileList) => base.getProps().onSuccess?.(responseBody, file, fileList),
            notifyProgress: (percent, file, fileList) => base.getProps().onProgress?.(percent, file, fileList),
            notifyRemove: (file, fileList, fileItem) => base.getProps().onRemove?.(file, fileList, fileItem),
            notifySizeError: (file, fileList) => base.getProps().onSizeError?.(file, fileList),
            notifyExceed: (fileList) => base.getProps().onExceed?.(fileList),
            updateFileList: (fileList, cb) => base.setState({ fileList }, cb),
            // called only when beforeUpload is a function; its result goes through unchanged, so undefined uploads nothing
            notifyBeforeUpload: ({ file, fileList }) => (base.getProps().beforeUpload as NonNullable<UploadProps['beforeUpload']>)({ file, fileList }),
            notifyAfterUpload: ({ response, file, fileList }) => base.getProps().afterUpload?.({ response, file, fileList }) ?? {},
            // clearing the value makes picking the same file again fire change
            resetInput: () => {
                if (input) {
                    input.value = '';
                }
            },
            resetReplaceInput: () => {
                if (replaceInput) {
                    replaceInput.value = '';
                }
            },
            notifyPastingError: (error) => base.getProps().onPastingError?.(error),
            notifyCropError: (error) => base.getProps().onCropError?.(error),
            updateDragAreaStatus: (dragAreaStatus) => base.setState({ dragAreaStatus: dragAreaStatus as UploadState['dragAreaStatus'] }),
            notifyChange: ({ currentFile, fileList }) => base.getProps().onChange?.({ currentFile, fileList }),
            // the foundation's own url map is the source of truth
            updateLocalUrls: () => undefined,
            notifyClear: () => base.getProps().onClear?.(),
            notifyPreviewClick: (file) => base.getProps().onPreviewClick?.(file),
            notifyRetry: (fileItem) => base.getProps().onRetry?.(fileItem),
            notifyDrop: (e, files, fileList) => base.getProps().onDrop?.(e, files, fileList),
            notifyAcceptInvalid: (invalidFiles) => base.getProps().onAcceptInvalid?.(invalidFiles),
            notifyBeforeRemove: (file, fileList) => base.getProps().beforeRemove?.(file, fileList) ?? true,
            notifyBeforeClear: (fileList) => base.getProps().beforeClear?.(fileList) ?? true,
            getCropperCanvas: () => cropper?.getCropperCanvas() ?? null,
        })
    );

    // an enclosing Tooltip wraps a disabled Upload so that it still receives the pointer (F4)
    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const prompt = children(() => local.prompt);
    const validateMessage = children(() => local.validateMessage);
    const fileList = createMemo(() => (local.fileList === undefined ? state().fileList : local.fileList || []));

    const dragHandlers = {
        onDragEnter: (e: DragEvent) => foundation.handleDragEnter(e),
        onDragOver: (e: DragEvent) => foundation.handleDragOver(e),
        onDragLeave: (e: DragEvent) => foundation.handleDragLeave(e),
        onDrop: (e: DragEvent) => foundation.handleDrop(e),
    };

    const isPicture = () => local.listType === strings.FILE_LIST_PIC;

    const showAdd = () => local.limit === undefined || local.limit > fileList().length;

    const cropConfig = () => (typeof local.crop === 'object' ? local.crop : {});

    const dragLegal = () => state().dragAreaStatus === strings.DRAG_AREA_LEGAL;

    // capture works by presence, so `true` is the empty attribute and `false` none
    const captureAttr = () => (local.capture === true ? '' : local.capture || undefined) as JSX.InputHTMLAttributes<HTMLInputElement>['capture'];

    const openFileDialog = () => {
        if (local.disabled || !input) {
            return;
        }
        input.click();
        local.onOpenFileDialog?.();
    };

    const handle: UploadHandle = {
        insert: foundation.insertFileToList,
        upload: foundation.manualUpload,
        openFileDialog,
    };

    const replace = (file: FileItem) => {
        if (local.disabled) {
            return;
        }
        foundation.setState({ replaceUid: file.uid });
        replaceInput?.click();
    };

    const cards = () => root.querySelector(`.${prefixCls}-${isPicture() ? 'picture-list' : 'file-list-main'}`)?.children ?? [];

    const trackFocus = (e: FocusEvent & { target: Element }) => listFocus.track(e.target, cards());

    const untrackFocus = (e: FocusEvent & { target: Element }) => listFocus.untrack(e.target);

    // Blur bubbles, also from the crop dialog rendered in a portal; moving between the controls inside is not leaving
    // the Upload, and a form validates on blur
    const handleFocusOut = (e: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusOut, e);
        if (e.currentTarget.contains(e.target) && !(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) {
            callHandler(local.onBlur, e);
        }
    };

    const setRoot = (node: HTMLDivElement) => {
        root = node;
        registerTrigger(node);
        mergeRefs(local.ref)(Object.assign(node, handle));
    };

    const cardProps = (file: Accessor<FileItem>, index: number): RenderFileItemProps =>
        mergeProps(
            {
                get showRetry() {
                    return local.showRetry;
                },
                get showReplace() {
                    return local.showReplace;
                },
            },
            file,
            {
                index,
                onRemove: () => foundation.handleRemove(file()),
                onRetry: () => foundation.retry(file()),
                onReplace: () => replace(file()),
                get previewFile() {
                    return local.previewFile;
                },
                get listType() {
                    return local.listType;
                },
                get style() {
                    return local.itemStyle;
                },
                get disabled() {
                    return local.disabled;
                },
                get showPicInfo() {
                    return local.showPicInfo;
                },
                get renderPicInfo() {
                    return local.renderPicInfo;
                },
                get renderPicPreviewIcon() {
                    return local.renderPicPreviewIcon;
                },
                get renderPicClose() {
                    return local.renderPicClose;
                },
                get renderFileOperation() {
                    return local.renderFileOperation;
                },
                get renderThumbnail() {
                    return local.renderThumbnail;
                },
                get renderValidateMessage() {
                    return local.renderValidateMessage;
                },
                get onPreviewClick() {
                    return local.onPreviewClick === undefined ? undefined : () => foundation.handlePreviewClick(file());
                },
                get picWidth() {
                    return local.picWidth;
                },
                get picHeight() {
                    return local.picHeight;
                },
                get showTooltip() {
                    return local.showTooltip;
                },
                // undefined falls through to the file's own message
                get validateMessage() {
                    const { status, validateMessage, _sizeInvalid } = file();
                    if (validateMessage) {
                        return undefined;
                    }
                    if (_sizeInvalid) {
                        return locale().locale.illegalSize;
                    }
                    return status === strings.FILE_STATUS_UPLOAD_FAIL ? locale().locale.fail : undefined;
                },
            }
        );

    const renderCard = (file: Accessor<FileItem>, index: number) => {
        const item = cardProps(file, index);
        return (
            <Show keyed when={local.renderFileItem} fallback={<FileCard {...item} />}>
                {(render) => render(item)}
            </Show>
        );
    };

    const pictureAdd = () => (
        <AddArea
            {...(local.draggable ? dragHandlers : {})}
            ref={(node) => (addArea = node)}
            class={clsx(`${prefixCls}-add`, `${prefixCls}-picture-add`, {
                [`${prefixCls}-picture-add-disabled`]: local.disabled,
                [`${dragAreaCls}-legal`]: local.draggable && dragLegal(),
            })}
            style={{ height: toCssLength(local.picHeight), width: toCssLength(local.picWidth) }}
            disabled={local.disabled}
            label={locale().locale.upload}
            tabIndex={local.tabIndex}
            x-semi-prop="children"
            onOpen={openFileDialog}
        >
            {local.children}
        </AddArea>
    );

    // only shown without children; reading the icon or text anywhere else would create them uninserted
    const dragPrompt = () => {
        const icon = children(() => local.dragIcon);
        const mainText = children(() => local.dragMainText);
        return (
            <>
                <div class={`${dragAreaCls}-icon`} x-semi-prop="dragIcon">
                    {hasContent(icon()) ? icon() : <IconUpload size="extra-large" />}
                </div>
                <div class={`${dragAreaCls}-text`}>
                    <div class={`${dragAreaCls}-main-text`} x-semi-prop="dragMainText">
                        {hasContent(mainText()) ? mainText() : locale().locale.mainText}
                    </div>
                    <div class={`${dragAreaCls}-sub-text`} x-semi-prop="dragSubText">
                        {local.dragSubText}
                    </div>
                    <div class={`${dragAreaCls}-tips`}>
                        <Show when={dragLegal()}>
                            <span class={`${dragAreaCls}-tips-legal`}>{locale().locale.legalTips}</span>
                        </Show>
                    </div>
                </div>
            </>
        );
    };

    const dragArea = () => {
        const area: AddAreaContextValue = { hasControl: false };
        const content = children(() => <AddAreaContext.Provider value={area}>{local.children}</AddAreaContext.Provider>);
        return (
            <AddArea
                {...dragHandlers}
                context={area}
                ref={(node) => (addArea = node)}
                class={clsx(dragAreaCls, {
                    [`${dragAreaCls}-legal`]: dragLegal(),
                    [`${dragAreaCls}-custom`]: hasContent(content()),
                })}
                disabled={local.disabled}
                label={locale().locale.upload}
                tabIndex={local.tabIndex}
                onOpen={openFileDialog}
            >
                <Show when={hasContent(content())} fallback={dragPrompt()}>
                    {content()}
                </Show>
            </AddArea>
        );
    };

    const listTitle = () => {
        const title = children(() => local.fileListTitle as JSX.Element);
        // children() calls only zero-arity functions, so a render function stays as given
        const render = () => {
            const value = title() as unknown;
            return typeof value === 'function' ? (value as TitleRender) : undefined;
        };
        const titleProps: RenderFileListTitleProps = {
            get fileList() {
                return fileList();
            },
            onClear: foundation.handleClear,
            get clearText() {
                return locale().locale.clear;
            },
        };
        return (
            <Show
                keyed
                when={render()}
                fallback={
                    <>
                        <span class={`${prefixCls}-file-list-title-choosen`}>{hasContent(title()) ? title() : locale().locale.selectedFiles}</span>
                        <Show when={local.showClear && !local.disabled}>
                            <button type="button" class={`${prefixCls}-file-list-title-clear`} onClick={foundation.handleClear}>
                                {locale().locale.clear}
                            </button>
                        </Show>
                    </>
                }
            >
                {(renderTitle) => renderTitle(titleProps)}
            </Show>
        );
    };

    // before the setState callbacks, so an upload started from one sees the parent's list; the state read reruns it
    // when the parent keeps the same array after an internal update
    createRenderEffect(() => {
        void state().fileList;
        if (local.fileList !== undefined) {
            foundation.syncLatestFileList(local.fileList || []);
        }
    });

    useWatch(() => local.fileList, foundation.handleFileListPropChange);
    createEffect(on([fileList, () => local.disabled], () => listFocus.restore(cards(), addArea?.isConnected ? addArea : null)));
    useEventListener(() => document.body, 'paste', foundation.handlePasting, { enabled: () => Boolean(local.addOnPasting) && !local.disabled });

    return (
        <div
            {...rest}
            ref={(node) => setRoot(node)}
            class={clsx(
                prefixCls,
                {
                    [`${prefixCls}-picture`]: isPicture(),
                    [`${prefixCls}-disabled`]: local.disabled,
                    [`${prefixCls}-default`]: props.validateStatus === 'default',
                    [`${prefixCls}-error`]: props.validateStatus === 'error',
                    [`${prefixCls}-warning`]: props.validateStatus === 'warning',
                    [`${prefixCls}-success`]: props.validateStatus === 'success',
                },
                local.class
            )}
            role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as Role}
            x-prompt-pos={local.promptPosition}
            onFocusOut={handleFocusOut}
        >
            <input
                ref={(node) => (input = node)}
                type="file"
                class={`${prefixCls}-hidden-input`}
                tabIndex={-1}
                autocomplete="off"
                multiple={local.multiple}
                accept={local.accept}
                capture={captureAttr()}
                {...(local.directory ? { directory: 'directory', webkitdirectory: 'webkitdirectory' } : {})}
                onChange={(e) => foundation.addFiles(e.currentTarget.files ?? [])}
            />
            <input ref={(node) => (replaceInput = node)} type="file" class={`${prefixCls}-hidden-input-replace`} tabIndex={-1} autocomplete="off" multiple={false} accept={local.accept} onChange={(e) => foundation.handleReplaceChange(e.currentTarget.files ?? [])} />
            <Show when={!isPicture()}>
                <Show
                    when={local.draggable}
                    fallback={
                        <AddArea ref={(node) => (addArea = node)} class={`${prefixCls}-add`} disabled={local.disabled} label={locale().locale.upload} tabIndex={local.tabIndex} onOpen={openFileDialog}>
                            {local.children}
                        </AddArea>
                    }
                >
                    {dragArea()}
                </Show>
            </Show>
            <Show when={hasContent(prompt())}>
                <div class={`${prefixCls}-prompt`} x-semi-prop="prompt">
                    {prompt()}
                </div>
            </Show>
            <Show when={hasContent(validateMessage())}>
                <div class={`${prefixCls}-validate-message`} x-semi-prop="validateMessage">
                    {validateMessage()}
                </div>
            </Show>
            <Show when={isPicture()}>
                <Show when={local.showUploadList} fallback={<Show when={showAdd()}>{pictureAdd()}</Show>}>
                    {/* The wrappers stay when the list is empty, so adding the first file keeps the add button mounted and focused */}
                    <div class={clsx(`${prefixCls}-file-list`, `${prefixCls}-picture-file-list`)} onFocusIn={trackFocus} onFocusOut={untrackFocus}>
                        <div class={`${prefixCls}-file-list-main`}>
                            <Show when={showAdd() && local.hotSpotLocation === 'start'}>{pictureAdd()}</Show>
                            {/* a list owns only its items, so the add button sits beside it; display: contents keeps the
                                pictures and the button in one wrapping row */}
                            <Show when={fileList().length > 0}>
                                <div class={`${prefixCls}-picture-list`} aria-label={locale().locale.pictureList} role="list">
                                    <Index each={fileList()}>{renderCard}</Index>
                                </div>
                            </Show>
                            <Show when={showAdd() && local.hotSpotLocation === 'end'}>{pictureAdd()}</Show>
                        </div>
                    </div>
                </Show>
            </Show>
            <Show when={local.listType === strings.FILE_LIST_DEFAULT && local.showUploadList && fileList().length > 0}>
                <div class={`${prefixCls}-file-list`} onFocusIn={trackFocus} onFocusOut={untrackFocus}>
                    <Show when={local.limit !== 1}>
                        <div class={`${prefixCls}-file-list-title`}>{listTitle()}</div>
                    </Show>
                    <div class={`${prefixCls}-file-list-main`} aria-label={locale().locale.fileList} role="list">
                        <Index each={fileList()}>{renderCard}</Index>
                    </div>
                </div>
            </Show>
            <Modal
                {...local.cropModalProps}
                bodyStyle={{ height: '400px', ...local.cropModalProps?.bodyStyle }}
                style={{ height: '500px', ...local.cropModalProps?.style }}
                title={cropConfig().modalTitle || locale().locale.cropTitle}
                cancelText={cropConfig().modalCancelText}
                okText={cropConfig().modalOkText}
                visible={state().cropperVisible}
                width={local.cropModalProps?.width ?? 600}
                onCancel={foundation.cancelCrop}
                onOk={foundation.confirmCrop}
            >
                {/* a new image mounts a new Cropper: a reused one would keep the zoom of the previous image */}
                <Show keyed when={state().cropperSrc || undefined}>
                    {(src) => {
                        onCleanup(() => (cropper = undefined));
                        return (
                            <Cropper
                                ref={(value: CropperHandle) => (cropper = value)}
                                style={{ width: '100%', height: '100%' }}
                                aspectRatio={cropConfig().aspectRatio}
                                fill={cropConfig().fill}
                                maxZoom={cropConfig().maxZoom}
                                minZoom={cropConfig().minZoom}
                                shape={cropConfig().shape || 'rect'}
                                src={src}
                                zoomStep={cropConfig().zoomStep}
                            />
                        );
                    }}
                </Show>
            </Modal>
        </div>
    );
}
