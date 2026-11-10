<script lang="ts">
    import { untrack } from 'svelte';
    import { omit } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/upload/constants';
    import UploadFoundation, { type UploadAdapter, type UploadBaseProps, type UploadBaseState } from '@fibrae/semi-foundation/components/upload/foundation';
    import { ListFocusTracker } from '@fibrae/semi-foundation/components/upload/utils';
    import { joinIds, namedRole, toCssLength } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/upload/upload.scss';
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import Cropper from '../cropper/cropper.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import Modal from '../modal/modal.svelte';
    import AddArea from './add-area.svelte';
    import FileCard from './file-card.svelte';
    import type { CustomFile, FileItem, UploadCropProps, UploadFileItemSlotProps, UploadProps } from './interface.js';

    interface UploadState extends UploadBaseState {
        fileList: FileItem[];
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
    const formLocale = useLocale('Form');

    const uid = $props.id();
    let input = $state<HTMLInputElement>();
    let replaceInput = $state<HTMLInputElement>();
    let cropper = $state<ReturnType<typeof Cropper>>();
    let root = $state<HTMLDivElement>();
    let fileListRoot = $state<HTMLDivElement>();
    let addAreaHasControl = $state(false);
    const listFocus = new ListFocusTracker();

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: UploadBaseProps = {
        get accept() {
            return accept;
        },
        get addOnPasting() {
            return addOnPasting;
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
        (view) => UploadFoundation.getInitialState(view),
        () => ({
            notifyFileSelect: (files) => onFileChange?.(files),
            notifyError: (error, fileInstance, list, xhr) => onError?.(error, fileInstance, list as FileItem[], xhr),
            notifySuccess: (body, file, list) => onSuccess?.(body, file, list as FileItem[]),
            notifyProgress: (percent, file, list) => onProgress?.(percent, file, list as FileItem[]),
            notifyRemove: (file, list, item) => onRemove?.(file, list as FileItem[], item as FileItem),
            notifySizeError: (file, list) => onSizeError?.(file, list as FileItem[]),
            notifyExceed: (files) => onExceed?.(files),
            notifyBeforeUpload: (object) => (beforeUpload as NonNullable<UploadProps['beforeUpload']>)(object),
            notifyAfterUpload: (object) => (afterUpload as NonNullable<UploadProps['afterUpload']>)(object),
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
            openReplacePicker: () => replaceInput?.click(),
            notifyBeforeRemove: (file, list) => beforeRemove?.(file as FileItem, list as FileItem[]) ?? true,
            notifyBeforeClear: (list) => beforeClear?.(list as FileItem[]) ?? true,
            notifyChange: ({ currentFile, fileList: next }) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                fileList = next as FileItem[];
                onChange?.({ currentFile: currentFile as FileItem | null | undefined, fileList: next as FileItem[] });
            },
            notifyClear: () => onClear?.(),
            notifyPreviewClick: (file) => onPreviewClick?.(file as FileItem),
            notifyRetry: (item) => onRetry?.(item as FileItem),
            notifyDrop: (event, files, list) => onDrop?.(event, files, list as FileItem[]),
            notifyAcceptInvalid: (files) => onAcceptInvalid?.(files),
            notifyPastingError: (error) => onPastingError?.(error),
            notifyCropError: (error) => onCropError?.(error),
            getCropperCanvas: () => cropper?.getCropperCanvas() ?? null,
        })
    );

    const prefix = cssClasses.PREFIX;
    const dragArea = `${prefix}-drag-area`;
    const isPicture = $derived(listType === strings.FILE_LIST_PIC);
    const cropConfig = $derived<UploadCropProps>(typeof crop === 'object' ? crop : {});
    const shownFiles = $derived(fileList ?? states().fileList);
    const showAdd = $derived(limit === undefined || limit > shownFiles.length);

    // role="group" supports no aria-required, nor does role="button", so it becomes a description of the add button; a
    // tabindex a Tooltip around the Upload injects would add a Tab stop beside the add button, so it goes there instead;
    // blur does not bubble, so it is called from focusout
    const rootRest = $derived(omit(rest, ['aria-required', 'tabindex', 'onblur']));
    const addTabindex = $derived(rest.tabindex ?? undefined);
    const addDescribedby = $derived(rest['aria-required'] === true || rest['aria-required'] === 'true' ? `${uid}-required` : undefined);

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

    const handleFocusout = (event: FocusEvent & { currentTarget: HTMLDivElement }) => {
        rest.onfocusout?.(event);
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
            rest.onblur?.(event);
        }
    };

    const cardProps = (file: FileItem, index: number): UploadFileItemSlotProps => ({
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
        validateMessage: UploadFoundation.getFallbackValidateMessage(file, locale().locale),
        style: itemStyle,
        onRemove: () => foundation.handleRemove(file),
        onRetry: () => foundation.retry(file),
        onReplace: () => foundation.startReplace(file.uid),
        onPreviewClick: onPreviewClick ? () => foundation.handlePreviewClick(file) : undefined,
    });

    $effect(() => {
        void shownFiles;
        void disabled;
        untrack(() => listFocus.restore(cardsOf(), root?.querySelector<HTMLElement>(`.${prefix}-add, .${dragArea}`) ?? null));
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
        bind:hasControl={addAreaHasControl}
        class={[
            `${prefix}-add`,
            `${prefix}-picture-add`,
            {
                [`${prefix}-picture-add-disabled`]: disabled,
                [`${dragArea}-legal`]: draggable && states().dragAreaStatus === strings.DRAG_AREA_LEGAL,
            },
        ]}
        describedby={addDescribedby}
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
    aria-describedby={joinIds(rest['aria-describedby'], addAreaHasControl && addDescribedby)}
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
    role={namedRole(rest)}
    {...{ 'x-prompt-pos': promptPosition }}
    onfocusout={handleFocusout}
>
    <!-- describes the add area as the button; a slotted control is out of reach, so the root group takes it then -->
    {#if addDescribedby}
        <span hidden id={addDescribedby}>{formLocale().locale.required}</span>
    {/if}
    <input {accept} autocomplete="off" bind:this={input} capture={captureAttr} class={`${prefix}-hidden-input`} {...directory ? { directory: 'directory', webkitdirectory: true } : {}} {multiple} tabindex="-1" type="file" onchange={(event) => foundation.addFiles(event.currentTarget.files ?? [])} />
    <input {accept} autocomplete="off" bind:this={replaceInput} class={`${prefix}-hidden-input-replace`} multiple={false} tabindex="-1" type="file" onchange={(event) => foundation.handleReplaceChange(event.currentTarget.files ?? [])} />

    {#if !isPicture}
        {#if draggable}
            <AddArea
                bind:hasControl={addAreaHasControl}
                class={[
                    dragArea,
                    {
                        [`${dragArea}-legal`]: states().dragAreaStatus === strings.DRAG_AREA_LEGAL,
                        [`${dragArea}-custom`]: children,
                    },
                ]}
                describedby={addDescribedby}
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
            <AddArea bind:hasControl={addAreaHasControl} class={`${prefix}-add`} describedby={addDescribedby} {disabled} onOpen={openFileDialog} tabindex={addTabindex}>
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
