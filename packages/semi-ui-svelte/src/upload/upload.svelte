<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import { on } from 'svelte/events';
    import { omit } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/upload/constants';
    import UploadFoundation, { type UploadAdapter, type UploadBaseProps, type UploadBaseState } from '@fibrae/semi-foundation/upload/foundation';
    import { ListFocusTracker } from '@fibrae/semi-foundation/upload/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/upload/upload.scss';
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import Cropper from '../cropper/cropper.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import Modal from '../modal/modal.svelte';
    import AddArea from './add-area.svelte';
    import FileCard from './file-card.svelte';
    import type { CustomFile, FileItem, UploadCropProps, UploadFileItemSlotProps, UploadProps } from './interface.js';

    interface UploadState extends UploadBaseState {
        dragAreaStatus: 'default' | 'legal';
        fileList: FileItem[];
        inputKey: number;
        replaceInputKey: number;
    }

    type Foundation = UploadFoundation<UploadBaseProps, UploadState, DragEvent>;
    type Adapter = UploadAdapter<UploadBaseProps, UploadState, DragEvent>;

    const defaults = useDefaultProps('Upload');

    // No fallback on `fileList`: a bound `undefined` (form reset) would throw with one
    let {
        fileList = $bindable(),
        accept = defaults('accept'),
        action,
        addOnPasting = defaults('addOnPasting', false),
        afterUpload = defaults('afterUpload'),
        beforeClear = defaults('beforeClear'),
        beforeCrop = defaults('beforeCrop'),
        beforeRemove = defaults('beforeRemove'),
        beforeUpload = defaults('beforeUpload'),
        capture = defaults('capture'),
        crop = defaults('crop', false),
        cropModalProps = defaults('cropModalProps'),
        customRequest = defaults('customRequest'),
        data = defaults('data'),
        directory = defaults('directory', false),
        disabled = defaults('disabled', false),
        draggable = defaults('draggable', false),
        fileName = defaults('fileName'),
        headers = defaults('headers'),
        hotSpotLocation = defaults('hotSpotLocation', 'end'),
        itemStyle = defaults('itemStyle'),
        limit = defaults('limit'),
        listType = defaults('listType', 'list'),
        maxSize = defaults('maxSize'),
        minSize = defaults('minSize'),
        multiple = defaults('multiple', false),
        name = defaults('name'),
        onPreviewClick = defaults('onPreviewClick'),
        picHeight = defaults('picHeight'),
        picWidth = defaults('picWidth'),
        promptPosition = defaults('promptPosition', 'right'),
        showClear = defaults('showClear', true),
        showPicInfo = defaults('showPicInfo', false),
        showReplace = defaults('showReplace', false),
        showRetry = defaults('showRetry', true),
        showTooltip = defaults('showTooltip', true),
        showUploadList = defaults('showUploadList', true),
        transformFile = defaults('transformFile'),
        uploadTrigger = defaults('uploadTrigger', 'auto'),
        validateStatus = defaults('validateStatus'),
        withCredentials = defaults('withCredentials', false),
        onAcceptInvalid,
        onChange,
        onClear,
        onCropError,
        onDrop,
        onError,
        onExceed,
        onFileChange,
        onOpenFileDialog,
        onPastingError,
        onProgress,
        onRemove,
        onRetry,
        onSizeError,
        onSuccess,
        children,
        dragIcon,
        dragMainText,
        dragSubText,
        ellipsisTooltip,
        fileItem,
        fileListHeader,
        fileListTitle,
        fileOperation,
        fileValidateMessage,
        picClose,
        picInfo,
        picPreviewIcon,
        previewFile,
        prompt,
        thumbnail,
        validateMessage,
        ...rest
    }: UploadProps = $props();

    const locale = useLocale('Upload');

    let input = $state<HTMLInputElement>();
    let replaceInput = $state<HTMLInputElement>();
    let cropper = $state<ReturnType<typeof Cropper>>();
    let root = $state<HTMLDivElement>();
    let fileListRoot = $state<HTMLDivElement>();
    const listFocus = new ListFocusTracker();

    // A request outlives the component (its upload is not aborted), but its results are no longer reported once unmounted
    let alive = true;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: UploadBaseProps = {
        get accept() {
            return accept;
        },
        get action() {
            return action;
        },
        get afterUpload() {
            return afterUpload;
        },
        get beforeCrop() {
            return beforeCrop;
        },
        get beforeUpload() {
            return beforeUpload;
        },
        get crop() {
            return crop;
        },
        get customRequest() {
            return customRequest;
        },
        get data() {
            return data;
        },
        get directory() {
            return directory;
        },
        get disabled() {
            return disabled;
        },
        get fileList() {
            return fileList;
        },
        get fileName() {
            return fileName;
        },
        get headers() {
            return headers;
        },
        get limit() {
            return limit;
        },
        get maxSize() {
            return maxSize;
        },
        get minSize() {
            return minSize;
        },
        get name() {
            return name;
        },
        get transformFile() {
            return transformFile;
        },
        get uploadTrigger() {
            return uploadTrigger;
        },
        get withCredentials() {
            return withCredentials;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, UploadBaseProps, UploadState>(
        UploadFoundation,
        foundationProps,
        () => ({
            fileList: [],
            replaceUid: '',
            inputKey: 0,
            replaceInputKey: 0,
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
            notifyFileSelect: (files) => alive && onFileChange?.(files),
            notifyError: (error, fileInstance, list, xhr) => alive && onError?.(error, fileInstance, list as FileItem[], xhr),
            notifySuccess: (body, file, list) => alive && onSuccess?.(body, file, list as FileItem[]),
            notifyProgress: (percent, file, list) => alive && onProgress?.(percent, file, list as FileItem[]),
            notifyRemove: (file, list, item) => alive && onRemove?.(file, list as FileItem[], item as FileItem),
            notifySizeError: (file, list) => alive && onSizeError?.(file, list as FileItem[]),
            notifyExceed: (files) => alive && onExceed?.(files),
            // after the commit the prop shows what the parent kept, which a parent that refused the write leaves unchanged
            updateFileList: (list, callback) =>
                base.setState({ fileList: list as FileItem[] }, () => {
                    if (fileList !== undefined) {
                        foundation.syncLatestFileList(fileList);
                    }
                    callback?.();
                }),
            notifyBeforeUpload: (object) => (beforeUpload as NonNullable<UploadProps['beforeUpload']>)(object),
            notifyAfterUpload: (object) => (afterUpload as NonNullable<UploadProps['afterUpload']>)(object),
            resetInput: () => base.setState({ inputKey: base.getState('inputKey') + 1 }),
            resetReplaceInput: () => base.setState({ replaceInputKey: base.getState('replaceInputKey') + 1 }),
            updateDragAreaStatus: (status) => base.setState({ dragAreaStatus: status as UploadState['dragAreaStatus'] }),
            notifyBeforeRemove: (file, list) => beforeRemove?.(file as FileItem, list as FileItem[]) ?? true,
            notifyBeforeClear: (list) => beforeClear?.(list as FileItem[]) ?? true,
            notifyChange: ({ currentFile, fileList: next }) => {
                if (!alive) {
                    return;
                }
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                fileList = next as FileItem[];
                onChange?.({ currentFile: currentFile as FileItem | null | undefined, fileList: next as FileItem[] });
            },
            // the foundation's own url map is the source of truth
            updateLocalUrls: () => {},
            notifyClear: () => alive && onClear?.(),
            notifyPreviewClick: (file) => onPreviewClick?.(file as FileItem),
            notifyRetry: (item) => alive && onRetry?.(item as FileItem),
            notifyDrop: (event, files, list) => alive && onDrop?.(event, files, list as FileItem[]),
            notifyAcceptInvalid: (files) => alive && onAcceptInvalid?.(files),
            notifyPastingError: (error) => alive && onPastingError?.(error),
            notifyCropError: (error) => alive && onCropError?.(error),
            getCropperCanvas: () => cropper?.getCropperCanvas() ?? null,
        })
    );

    const prefix = cssClasses.PREFIX;
    const dragArea = `${prefix}-drag-area`;
    const isPicture = $derived(listType === strings.FILE_LIST_PIC);
    const cropConfig = $derived<UploadCropProps>(typeof crop === 'object' ? crop : {});
    const shownFiles = $derived(fileList ?? states().fileList);
    const showAdd = $derived(limit === undefined || limit > shownFiles.length);

    // role="group" supports no aria-required, and a tabindex a Tooltip around the Upload injects would add a Tab stop
    // beside the add button, so it goes to the add button instead; blur does not bubble, so it is called from focusout
    const rootRest = $derived(omit(rest, ['aria-required', 'tabindex', 'onblur']));
    const addTabindex = $derived(rest.tabindex ?? undefined);

    // `capture` works by presence, and Svelte writes `false` on a non-boolean attribute as the string "false"
    const captureAttr = $derived((capture === true ? '' : capture || undefined) as 'user' | 'environment' | undefined);
    const cropModalRest = $derived(omit(cropModalProps ?? {}, ['style', 'bodyStyle', 'width']));
    const pictureAddStyle = $derived([picHeight !== undefined && `height: ${toCssLength(picHeight)}`, picWidth !== undefined && `width: ${toCssLength(picWidth)}`].filter(Boolean).join(';') || undefined);

    const dragListeners = {
        ondragenter: (event: DragEvent) => foundation.handleDragEnter(event),
        ondragover: (event: DragEvent) => foundation.handleDragOver(event),
        ondragleave: (event: DragEvent) => foundation.handleDragLeave(event),
        ondrop: (event: DragEvent) => foundation.handleDrop(event),
    };

    const cardsOf = () => fileListRoot?.querySelector(`.${prefix}-${isPicture ? 'picture-list' : 'file-list-main'}`)?.children ?? [];

    const trackFocus = ({ target }: FocusEvent) => {
        if (target instanceof Node) {
            listFocus.track(target, cardsOf());
        }
    };

    const untrackFocus = ({ target }: FocusEvent) => {
        if (target instanceof Node) {
            listFocus.untrack(target);
        }
    };

    const replace = (file: FileItem) => {
        if (disabled) {
            return;
        }
        foundation.setState({ replaceUid: file.uid });
        replaceInput?.click();
    };

    // Moving between the controls inside is not leaving the Upload
    const handleFocusout = (event: FocusEvent & { currentTarget: HTMLDivElement }) => {
        rest.onfocusout?.(event);
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
            rest.onblur?.(event);
        }
    };

    const cardProps = (file: FileItem, index: number): UploadFileItemSlotProps => {
        let message: string | undefined;
        if (file.status === strings.FILE_STATUS_UPLOAD_FAIL && !file.validateMessage) {
            message = locale().locale.fail;
        }
        if (file._sizeInvalid && !file.validateMessage) {
            message = locale().locale.illegalSize;
        }
        return {
            file,
            index,
            listType,
            disabled,
            showRetry,
            showReplace,
            showPicInfo,
            showTooltip,
            picWidth,
            picHeight,
            validateMessage: message,
            style: itemStyle,
            onRemove: () => foundation.handleRemove(file),
            onRetry: () => foundation.retry(file),
            onReplace: () => replace(file),
            onPreviewClick: onPreviewClick ? () => foundation.handlePreviewClick(file) : undefined,
        };
    };

    watch(
        () => fileList,
        (value) => {
            if (value === undefined) {
                foundation.handleFileListPropChange(value);
            } else {
                foundation.syncLatestFileList(value);
            }
        }
    );

    $effect(() => {
        void shownFiles;
        void disabled;
        untrack(() => listFocus.restore(cardsOf(), root?.querySelector<HTMLElement>(`.${prefix}-add, .${dragArea}`) ?? null));
    });

    $effect(() => {
        if (!addOnPasting || disabled) {
            return;
        }
        return on(document.body, 'paste', foundation.handlePasting);
    });

    onMount(() => () => {
        alive = false;
    });

    export function insert(files: CustomFile[], index?: number) {
        foundation.insertFileToList(files, index);
    }

    export function upload() {
        foundation.manualUpload();
    }

    export function openFileDialog() {
        if (disabled || !input) {
            return;
        }
        input.click();
        onOpenFileDialog?.();
    }
</script>

{#snippet pictureAdd()}
    <AddArea
        class={[
            `${prefix}-add`,
            `${prefix}-picture-add`,
            {
                [`${prefix}-picture-add-disabled`]: disabled,
                [`${dragArea}-legal`]: draggable && states().dragAreaStatus === strings.DRAG_AREA_LEGAL,
            },
        ]}
        {disabled}
        style={pictureAddStyle}
        tabindex={addTabindex}
        x-semi-prop="children"
        {...draggable ? dragListeners : {}}
        onOpen={openFileDialog}
    >
        {@render children?.()}
    </AddArea>
{/snippet}

{#snippet cards()}
    {#each shownFiles as file, index (file.uid || `${file.name}${index}`)}
        {#if fileItem}
            {@render fileItem(cardProps(file, index))}
        {:else}
            <FileCard {...cardProps(file, index)} {ellipsisTooltip} {fileOperation} {fileValidateMessage} {picClose} {picInfo} {picPreviewIcon} {previewFile} {thumbnail} />
        {/if}
    {/each}
{/snippet}

<div
    bind:this={root}
    {...rootRest}
    class={[
        prefix,
        rest.class,
        {
            [`${prefix}-picture`]: isPicture,
            [`${prefix}-disabled`]: disabled,
            [`${prefix}-default`]: validateStatus === 'default',
            [`${prefix}-error`]: validateStatus === 'error',
            [`${prefix}-warning`]: validateStatus === 'warning',
            [`${prefix}-success`]: validateStatus === 'success',
        },
    ]}
    role={groupRole(rest)}
    {...{ 'x-prompt-pos': promptPosition }}
    onfocusout={handleFocusout}
>
    <!-- a new key remounts the input, so picking the same file again fires change -->
    {#key states().inputKey}
        <input {accept} autocomplete="off" bind:this={input} capture={captureAttr} class={`${prefix}-hidden-input`} {...directory ? { directory: 'directory', webkitdirectory: true } : {}} {multiple} tabindex="-1" type="file" onchange={(event) => foundation.addFiles(event.currentTarget.files ?? [])} />
    {/key}
    {#key states().replaceInputKey}
        <input {accept} autocomplete="off" bind:this={replaceInput} class={`${prefix}-hidden-input-replace`} multiple={false} tabindex="-1" type="file" onchange={(event) => foundation.handleReplaceChange(event.currentTarget.files ?? [])} />
    {/key}
    {#if !isPicture}
        {#if draggable}
            <AddArea
                class={[
                    dragArea,
                    {
                        [`${dragArea}-legal`]: states().dragAreaStatus === strings.DRAG_AREA_LEGAL,
                        [`${dragArea}-custom`]: children,
                    },
                ]}
                {disabled}
                tabindex={addTabindex}
                {...dragListeners}
                onOpen={openFileDialog}
            >
                {#if children}
                    {@render children()}
                {:else}
                    <div class={`${dragArea}-icon`} x-semi-prop="dragIcon">
                        {#if dragIcon}
                            {@render dragIcon()}
                        {:else}
                            <IconUpload size="extra-large" />
                        {/if}
                    </div>
                    <div class={`${dragArea}-text`}>
                        <div class={`${dragArea}-main-text`} x-semi-prop="dragMainText">
                            {#if dragMainText}
                                {@render dragMainText()}
                            {:else}
                                {locale().locale.mainText}
                            {/if}
                        </div>
                        <div class={`${dragArea}-sub-text`} x-semi-prop="dragSubText">
                            {@render dragSubText?.()}
                        </div>
                        <div class={`${dragArea}-tips`}>
                            {#if states().dragAreaStatus === strings.DRAG_AREA_LEGAL}
                                <span class={`${dragArea}-tips-legal`}>{locale().locale.legalTips}</span>
                            {/if}
                        </div>
                    </div>
                {/if}
            </AddArea>
        {:else}
            <AddArea class={`${prefix}-add`} {disabled} onOpen={openFileDialog} tabindex={addTabindex}>
                {@render children?.()}
            </AddArea>
        {/if}
    {/if}
    {#if prompt}
        <div class={`${prefix}-prompt`} x-semi-prop="prompt">
            {@render prompt()}
        </div>
    {/if}
    {#if validateMessage}
        <div class={`${prefix}-validate-message`} x-semi-prop="validateMessage">
            {@render validateMessage()}
        </div>
    {/if}
    <!-- the picture wall keeps its wrappers when the list is empty, so adding the first file keeps the add button mounted and focused -->
    {#if showUploadList && (isPicture || (listType === strings.FILE_LIST_DEFAULT && shownFiles.length))}
        <div bind:this={fileListRoot} class={[`${prefix}-file-list`, { [`${prefix}-picture-file-list`]: isPicture }]} onfocusin={trackFocus} onfocusout={untrackFocus}>
            {#if !isPicture && limit !== 1}
                <div class={`${prefix}-file-list-title`}>
                    {#if fileListHeader}
                        {@render fileListHeader({ fileList: shownFiles, onClear: foundation.handleClear, clearText: locale().locale.clear })}
                    {:else}
                        <span class={`${prefix}-file-list-title-choosen`} x-semi-prop="fileListTitle">
                            {#if fileListTitle}
                                {@render fileListTitle()}
                            {:else}
                                {locale().locale.selectedFiles}
                            {/if}
                        </span>
                        {#if showClear && !disabled}
                            <button class={`${prefix}-file-list-title-clear`} type="button" onclick={foundation.handleClear}>
                                {locale().locale.clear}
                            </button>
                        {/if}
                    {/if}
                </div>
            {/if}
            <div aria-label={isPicture ? undefined : locale().locale.fileList} class={`${prefix}-file-list-main`} role={isPicture ? undefined : 'list'}>
                {#if isPicture && showAdd && hotSpotLocation === 'start'}
                    {@render pictureAdd()}
                {/if}
                <!-- a list owns only items: the add button sits beside it, display: contents keeps one row -->
                {#if shownFiles.length}
                    {#if isPicture}
                        <div aria-label={locale().locale.pictureList} class={`${prefix}-picture-list`} role="list">
                            {@render cards()}
                        </div>
                    {:else}
                        {@render cards()}
                    {/if}
                {/if}
                {#if isPicture && showAdd && hotSpotLocation === 'end'}
                    {@render pictureAdd()}
                {/if}
            </div>
        </div>
    {:else if isPicture && showAdd}
        {@render pictureAdd()}
    {/if}
    <Modal
        {...cropModalRest}
        bodyStyle={['height: 400px', cropModalProps?.bodyStyle].filter(Boolean).join(';')}
        cancelText={cropConfig.modalCancelText}
        okText={cropConfig.modalOkText}
        onCancel={foundation.cancelCrop}
        onOk={foundation.confirmCrop}
        style={['height: 500px', cropModalProps?.style].filter(Boolean).join(';')}
        title={cropConfig.modalTitle || locale().locale.cropTitle}
        visible={states().cropperVisible}
        width={cropModalProps?.width ?? 600}
    >
        <!-- a new image mounts a new Cropper: a reused one would keep the zoom of the previous image -->
        {#key states().cropperSrc}
            {#if states().cropperSrc}
                <Cropper aspectRatio={cropConfig.aspectRatio} bind:this={cropper} fill={cropConfig.fill} maxZoom={cropConfig.maxZoom} minZoom={cropConfig.minZoom} shape={cropConfig.shape || 'rect'} src={states().cropperSrc} style="width: 100%; height: 100%" zoomStep={cropConfig.zoomStep} />
            {/if}
        {/key}
    </Modal>
</div>
