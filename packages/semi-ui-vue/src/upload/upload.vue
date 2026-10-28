<script setup lang="ts">
    import { computed, onActivated, onBeforeUpdate, onDeactivated, onUpdated, shallowRef, useAttrs, useTemplateRef, watch, type InputHTMLAttributes } from 'vue';
    import { omit } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/upload/constants';
    import UploadFoundation, { type UploadAdapter, type UploadBaseState } from '@fibrae/semi-foundation/upload/foundation';
    import { ListFocusTracker } from '@fibrae/semi-foundation/upload/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/upload/upload.scss';
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import slotNodes, { hasSlotContent } from '../_base/slot-nodes';
    import useEventListener, { getBody } from '../_base/use-event-listener';
    import useFoundation from '../_base/use-foundation';
    import Cropper, { type CropperHandle } from '../cropper';
    import useLocale from '../locale/use-locale';
    import Modal from '../modal';
    import type { ModalProps } from '../modal/interface';
    import AddArea from './add-area.vue';
    import FileCard from './file-card.vue';
    import type { FileItem, UploadCropModalProps, UploadCropProps, UploadEmits, UploadFileItemSlotProps, UploadHandle, UploadProps, UploadSlots } from './interface';

    interface UploadState extends UploadBaseState {
        dragAreaStatus: 'default' | 'legal';
        fileList: FileItem[];
        inputKey: number;
        replaceInputKey: number;
    }

    type FnKey = 'afterUpload' | 'beforeClear' | 'beforeCrop' | 'beforeRemove' | 'beforeUpload' | 'customRequest' | 'data' | 'headers' | 'onPreviewClick' | 'transformFile';
    type Foundation = UploadFoundation<UploadProps, UploadState, DragEvent>;
    type Adapter = UploadAdapter<UploadProps, UploadState, DragEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<UploadProps & /* @vue-ignore */ ElementProps<'div', keyof UploadProps | EmitHandlers<UploadEmits>>>(), {
        accept: semiGlobalDefault('Upload', 'accept'),
        addOnPasting: () => semiDefault('Upload', 'addOnPasting', false),
        // Function-typed props cannot take a factory default; their global defaults are read through `fnProp`.
        afterUpload: undefined,
        beforeClear: undefined,
        beforeCrop: undefined,
        beforeRemove: undefined,
        beforeUpload: undefined,
        capture: semiGlobalDefault('Upload', 'capture'),
        crop: () => semiDefault('Upload', 'crop', false),
        cropModalProps: semiGlobalDefault('Upload', 'cropModalProps'),
        customRequest: undefined,
        data: undefined,
        defaultFileList: () => semiDefault('Upload', 'defaultFileList', []),
        directory: () => semiDefault('Upload', 'directory', false),
        disabled: () => semiDefault('Upload', 'disabled', false),
        draggable: () => semiDefault('Upload', 'draggable', false),
        fileList: semiGlobalDefault('Upload', 'fileList'),
        fileName: semiGlobalDefault('Upload', 'fileName'),
        headers: undefined,
        hotSpotLocation: () => semiDefault('Upload', 'hotSpotLocation', 'end'),
        itemStyle: semiGlobalDefault('Upload', 'itemStyle'),
        limit: semiGlobalDefault('Upload', 'limit'),
        listType: () => semiDefault('Upload', 'listType', 'list'),
        maxSize: semiGlobalDefault('Upload', 'maxSize'),
        minSize: semiGlobalDefault('Upload', 'minSize'),
        multiple: () => semiDefault('Upload', 'multiple', false),
        name: semiGlobalDefault('Upload', 'name'),
        onPreviewClick: undefined,
        picHeight: semiGlobalDefault('Upload', 'picHeight'),
        picWidth: semiGlobalDefault('Upload', 'picWidth'),
        promptPosition: () => semiDefault('Upload', 'promptPosition', 'right'),
        showClear: () => semiDefault('Upload', 'showClear', true),
        showPicInfo: () => semiDefault('Upload', 'showPicInfo', false),
        showReplace: () => semiDefault('Upload', 'showReplace', false),
        showRetry: () => semiDefault('Upload', 'showRetry', true),
        showTooltip: () => semiDefault('Upload', 'showTooltip', true),
        showUploadList: () => semiDefault('Upload', 'showUploadList', true),
        transformFile: undefined,
        uploadTrigger: () => semiDefault('Upload', 'uploadTrigger', 'auto'),
        validateStatus: semiGlobalDefault('Upload', 'validateStatus'),
        withCredentials: () => semiDefault('Upload', 'withCredentials', false),
    });

    const emit = defineEmits<UploadEmits>();
    const slots = defineSlots<UploadSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const i18n = useLocale('Upload');

    const input = useTemplateRef('input');
    const replaceInput = useTemplateRef('replaceInput');

    // Annotated: the adapter's getCropperCanvas reads this ref, so inference is circular (TS7022)
    const cropper = useTemplateRef<CropperHandle>('cropper');
    const root = useTemplateRef('root');
    const fileListRoot = useTemplateRef('fileListRoot');
    const listFocus = new ListFocusTracker();

    // A cached (KeepAlive) instance stays mounted, so its body listener would keep adding pasted files.
    const active = shallowRef(true);

    // role="group" supports no aria-required, and the tabindex a Tooltip around the Upload injects would add a Tab stop
    // beside the add button, so it goes to the add button instead. blur does not bubble, so a form's blur handler is
    // called from focusout instead.
    const DROPPED_ATTRS = new Set(['aria-required', 'tabindex', 'tabIndex', 'onBlur']);

    const prefix = cssClasses.PREFIX;
    const dragArea = `${prefix}-drag-area`;
    const isPicture = computed(() => props.listType === strings.FILE_LIST_PIC);
    const cropConfig = computed((): UploadCropProps => (typeof props.crop === 'object' ? props.crop : {}));
    const pictureListAttrs = computed(() => (isPicture.value ? { class: `${prefix}-picture-list`, role: 'list', 'aria-label': i18n.value.locale.pictureList } : {}));
    const addTabindex = computed(() => (attrs.tabindex ?? attrs.tabIndex) as number | string | undefined);

    const fnProp = <K extends FnKey>(key: K) => (props[key] ?? readSemiDefault(semi, 'Upload', key)) as UploadProps[K];

    const { foundation, state } = useFoundation<Foundation, Adapter, UploadProps, UploadState>(
        UploadFoundation,
        props,
        () => ({
            fileList: props.defaultFileList ?? [],
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
            notifyFileSelect: (files) => emit('fileChange', files),
            notifyError: (error, fileInstance, fileList, xhr) => emit('error', error, fileInstance, fileList, xhr),
            notifySuccess: (body, file, fileList) => emit('success', body, file, fileList),
            notifyProgress: (percent, file, fileList) => emit('progress', percent, file, fileList),
            notifyRemove: (file, fileList, fileItem) => emit('remove', file, fileList, fileItem),
            notifySizeError: (file, fileList) => emit('sizeError', file, fileList),
            notifyExceed: (files) => emit('exceed', files),
            updateFileList: (fileList, cb) => base.setState({ fileList }, cb),
            notifyBeforeUpload: (object) => (fnProp('beforeUpload') as NonNullable<UploadProps['beforeUpload']>)(object),
            notifyAfterUpload: (object) => (fnProp('afterUpload') as NonNullable<UploadProps['afterUpload']>)(object),
            resetInput: () => base.setState({ inputKey: base.getState('inputKey') + 1 }),
            resetReplaceInput: () => base.setState({ replaceInputKey: base.getState('replaceInputKey') + 1 }),
            updateDragAreaStatus: (status) => base.setState({ dragAreaStatus: status as UploadState['dragAreaStatus'] }),
            notifyBeforeRemove: (file, fileList) => fnProp('beforeRemove')?.(file, fileList) ?? true,
            notifyBeforeClear: (fileList) => fnProp('beforeClear')?.(fileList) ?? true,
            notifyChange: ({ currentFile, fileList }) => {
                emit('update:fileList', fileList);
                emit('change', { currentFile, fileList });
            },
            // the foundation's own url map is the source of truth
            updateLocalUrls: () => {},
            notifyClear: () => emit('clear'),
            notifyPreviewClick: (file) => fnProp('onPreviewClick')?.(file),
            notifyRetry: (fileItem) => emit('retry', fileItem),
            notifyDrop: (e, files, fileList) => emit('drop', e, files, fileList),
            notifyAcceptInvalid: (files) => emit('acceptInvalid', files),
            notifyPastingError: (error) => emit('pastingError', error),
            notifyCropError: (error) => emit('cropError', error),
            getCropperCanvas: () => cropper.value?.getCropperCanvas() ?? null,
        }),
        {
            props: {
                afterUpload: () => fnProp('afterUpload'),
                beforeCrop: () => fnProp('beforeCrop'),
                beforeUpload: () => fnProp('beforeUpload'),
                customRequest: () => fnProp('customRequest'),
                data: () => fnProp('data'),
                headers: () => fnProp('headers'),
                transformFile: () => fnProp('transformFile'),
            },
        }
    );

    const shownFiles = computed(() => (props.fileList === undefined ? state.value.fileList : (props.fileList ?? [])));
    const showAdd = computed(() => props.limit === undefined || props.limit > shownFiles.value.length);

    const dragListeners = {
        onDragenter: (e: DragEvent) => foundation.handleDragEnter(e),
        onDragover: (e: DragEvent) => foundation.handleDragOver(e),
        onDragleave: (e: DragEvent) => foundation.handleDragLeave(e),
        onDrop: (e: DragEvent) => foundation.handleDrop(e),
    };

    const cardsOf = () => fileListRoot.value?.querySelector(`.${prefix}-${isPicture.value ? 'picture-list' : 'file-list-main'}`)?.children ?? [];

    const trackFocus = (e: FocusEvent) => listFocus.track(e.target as Node, cardsOf());

    const untrackFocus = (e: FocusEvent) => listFocus.untrack(e.target as Node);

    const openFileDialog = () => {
        if (props.disabled || !input.value) return;
        input.value.click();
        emit('openFileDialog');
    };

    const replace = (file: FileItem) => {
        if (props.disabled) return;
        foundation.setState({ replaceUid: file.uid });
        replaceInput.value?.click();
    };

    const clear = () => foundation.handleClear();

    const filesOf = (e: Event) => (e.target as HTMLInputElement).files ?? [];

    const rootAttrs = (a: Record<string, unknown>) => Object.fromEntries(Object.entries(a).filter(([key]) => !DROPPED_ATTRS.has(key)));

    // Moving between the controls inside is not leaving the Upload. A form merges its own blur handler with the user's
    // into an array.
    const handleFocusout = (e: FocusEvent) => {
        if (!(e.currentTarget as Element).contains(e.relatedTarget as Node | null)) {
            [attrs.onBlur].flat().forEach((fn) => (fn as ((event: FocusEvent) => void) | undefined)?.(e));
        }
    };

    // `capture` works by presence, and Vue writes `false` on a non-boolean attribute as the string "false".
    const captureAttr = () => (props.capture === true ? '' : props.capture || undefined) as InputHTMLAttributes['capture'];

    const pictureAddBindings = () => ({
        class: [
            `${prefix}-add`,
            `${prefix}-picture-add`,
            {
                [`${prefix}-picture-add-disabled`]: props.disabled,
                [`${dragArea}-legal`]: props.draggable && state.value.dragAreaStatus === strings.DRAG_AREA_LEGAL,
            },
        ],
        style: { height: toCssLength(props.picHeight), width: toCssLength(props.picWidth) },
        'x-semi-prop': 'children',
        tabindex: addTabindex.value,
        ...(props.draggable ? dragListeners : {}),
    });

    const cardProps = (file: FileItem, index: number): UploadFileItemSlotProps => {
        let validateMessage: string | undefined;
        if (file.status === strings.FILE_STATUS_UPLOAD_FAIL && !file.validateMessage) {
            validateMessage = i18n.value.locale.fail;
        }
        if (file._sizeInvalid && !file.validateMessage) {
            validateMessage = i18n.value.locale.illegalSize;
        }
        return {
            file,
            index,
            listType: props.listType,
            disabled: props.disabled,
            showRetry: props.showRetry,
            showReplace: props.showReplace,
            showPicInfo: props.showPicInfo,
            showTooltip: props.showTooltip,
            picWidth: props.picWidth,
            picHeight: props.picHeight,
            validateMessage,
            style: props.itemStyle,
            onRemove: () => foundation.handleRemove(file),
            onRetry: () => foundation.retry(file),
            onReplace: () => replace(file),
            onPreviewClick: fnProp('onPreviewClick') ? () => foundation.handlePreviewClick(file) : undefined,
        };
    };

    const fileItemNodes = (file: FileItem, index: number) => slotNodes(slots.fileItem?.(cardProps(file, index)) ?? []);

    // v-bind of an object merges listeners with the explicit ones, so keys Upload owns are dropped first
    const cropModalRest = () => omit((props.cropModalProps ?? {}) as ModalProps & UploadCropModalProps, ['style', 'bodyStyle', 'width', 'visible', 'title', 'okText', 'cancelText', 'onOk', 'onCancel']);

    watch(
        () => props.fileList,
        (fileList) => foundation.handleFileListPropChange(fileList)
    );

    onUpdated(() => listFocus.restore(cardsOf(), root.value?.querySelector<HTMLElement>(`.${prefix}-add, .${dragArea}`) ?? null));

    // Sync on every update like React; a watch on the prop would miss a parent that refuses the update and keeps the array
    onBeforeUpdate(() => {
        if (props.fileList !== undefined) foundation.syncLatestFileList(props.fileList ?? []);
    });

    onActivated(() => {
        active.value = true;
    });

    onDeactivated(() => {
        active.value = false;
        if (state.value.cropperVisible) foundation.cancelCrop();
    });

    useEventListener(getBody, 'paste', (e) => foundation.handlePasting(e), {
        enabled: () => props.addOnPasting && !props.disabled && active.value,
    });

    defineExpose<UploadHandle>({
        insert: (files, index) => foundation.insertFileToList(files, index),
        upload: () => foundation.manualUpload(),
        openFileDialog,
    });
</script>

<template>
    <div
        ref="root"
        v-bind="rootAttrs($attrs)"
        :class="[
            prefix,
            {
                [`${prefix}-picture`]: isPicture,
                [`${prefix}-disabled`]: props.disabled,
                [`${prefix}-default`]: props.validateStatus === 'default',
                [`${prefix}-error`]: props.validateStatus === 'error',
                [`${prefix}-warning`]: props.validateStatus === 'warning',
                [`${prefix}-success`]: props.validateStatus === 'success',
            },
        ]"
        :role="groupRole($attrs)"
        :x-prompt-pos="props.promptPosition"
        @focusout="handleFocusout"
    >
        <!-- a new key remounts the input, so picking the same file again fires change -->
        <input
            :key="`input-${state.inputKey}`"
            ref="input"
            :accept="props.accept"
            autocomplete="off"
            :capture="captureAttr()"
            :class="`${prefix}-hidden-input`"
            :directory="props.directory ? 'directory' : undefined"
            :multiple="props.multiple"
            tabindex="-1"
            type="file"
            :webkitdirectory="props.directory ? 'webkitdirectory' : undefined"
            @change="foundation.addFiles(filesOf($event))"
        />
        <input :key="`replace-${state.replaceInputKey}`" ref="replaceInput" :accept="props.accept" autocomplete="off" :class="`${prefix}-hidden-input-replace`" :multiple="false" tabindex="-1" type="file" @change="foundation.handleReplaceChange(filesOf($event))" />
        <template v-if="!isPicture">
            <AddArea
                v-if="props.draggable"
                :class="[
                    dragArea,
                    {
                        [`${dragArea}-legal`]: state.dragAreaStatus === strings.DRAG_AREA_LEGAL,
                        [`${dragArea}-custom`]: $slots.default,
                    },
                ]"
                :disabled="props.disabled"
                :tabindex="addTabindex"
                v-bind="dragListeners"
                @open="openFileDialog"
            >
                <slot>
                    <div :class="`${dragArea}-icon`" x-semi-prop="dragIcon">
                        <slot name="dragIcon">
                            <IconUpload size="extra-large" />
                        </slot>
                    </div>
                    <div :class="`${dragArea}-text`">
                        <div :class="`${dragArea}-main-text`" x-semi-prop="dragMainText">
                            <slot name="dragMainText">{{ i18n.locale.mainText }}</slot>
                        </div>
                        <div :class="`${dragArea}-sub-text`" x-semi-prop="dragSubText">
                            <slot name="dragSubText" />
                        </div>
                        <div :class="`${dragArea}-tips`">
                            <span v-if="state.dragAreaStatus === strings.DRAG_AREA_LEGAL" :class="`${dragArea}-tips-legal`">
                                {{ i18n.locale.legalTips }}
                            </span>
                        </div>
                    </div>
                </slot>
            </AddArea>
            <AddArea v-else :class="`${prefix}-add`" :disabled="props.disabled" :tabindex="addTabindex" @open="openFileDialog">
                <slot />
            </AddArea>
        </template>
        <div v-if="hasSlotContent($slots.prompt)" :class="`${prefix}-prompt`" x-semi-prop="prompt">
            <slot name="prompt" />
        </div>
        <div v-if="hasSlotContent($slots.validateMessage)" :class="`${prefix}-validate-message`" x-semi-prop="validateMessage">
            <slot name="validateMessage" />
        </div>
        <!-- the picture wall keeps its wrappers when the list is empty, so adding the first file keeps the add button mounted and focused -->
        <div v-if="props.showUploadList && (isPicture || (props.listType === strings.FILE_LIST_DEFAULT && shownFiles.length))" ref="fileListRoot" :class="[`${prefix}-file-list`, { [`${prefix}-picture-file-list`]: isPicture }]" @focusin="trackFocus" @focusout="untrackFocus">
            <div v-if="!isPicture && props.limit !== 1" :class="`${prefix}-file-list-title`">
                <slot v-if="$slots.fileListHeader" name="fileListHeader" v-bind="{ fileList: shownFiles, onClear: clear, clearText: i18n.locale.clear }" />
                <template v-else>
                    <span :class="`${prefix}-file-list-title-choosen`">
                        <slot name="fileListTitle">{{ i18n.locale.selectedFiles }}</slot>
                    </span>
                    <button v-if="props.showClear && !props.disabled" :class="`${prefix}-file-list-title-clear`" type="button" @click="clear">
                        {{ i18n.locale.clear }}
                    </button>
                </template>
            </div>
            <div :class="`${prefix}-file-list-main`" v-bind="isPicture ? {} : { role: 'list', 'aria-label': i18n.locale.fileList }">
                <AddArea v-if="isPicture && showAdd && props.hotSpotLocation === 'start'" v-bind="pictureAddBindings()" :disabled="props.disabled" @open="openFileDialog">
                    <slot />
                </AddArea>
                <!-- a list owns only items: the add button sits beside it, display: contents keeps one row -->
                <component :is="isPicture ? 'div' : SlotFragment" v-if="shownFiles.length" v-bind="pictureListAttrs">
                    <template v-for="(file, index) in shownFiles" :key="file.uid || `${file.name}${index}`">
                        <template v-if="$slots.fileItem">
                            <component :is="node" v-for="[node, key] in fileItemNodes(file, index)" :key="key" />
                        </template>
                        <FileCard v-else v-bind="cardProps(file, index)">
                            <template v-if="$slots.previewFile" #previewFile="p">
                                <slot name="previewFile" v-bind="p" />
                            </template>
                            <template v-if="$slots.thumbnail" #thumbnail="p">
                                <slot name="thumbnail" v-bind="p" />
                            </template>
                            <template v-if="$slots.picInfo" #picInfo="p">
                                <slot name="picInfo" v-bind="p" />
                            </template>
                            <template v-if="$slots.picPreviewIcon" #picPreviewIcon="p">
                                <slot name="picPreviewIcon" v-bind="p" />
                            </template>
                            <template v-if="$slots.picClose" #picClose="p">
                                <slot name="picClose" v-bind="p" />
                            </template>
                            <template v-if="$slots.fileOperation" #fileOperation="p">
                                <slot name="fileOperation" v-bind="p" />
                            </template>
                            <template v-if="$slots.fileValidateMessage" #validateMessage="p">
                                <slot name="fileValidateMessage" v-bind="p" />
                            </template>
                            <template v-if="$slots.ellipsisTooltip" #ellipsisTooltip="p">
                                <slot name="ellipsisTooltip" v-bind="p" />
                            </template>
                        </FileCard>
                    </template>
                </component>
                <AddArea v-if="isPicture && showAdd && props.hotSpotLocation === 'end'" v-bind="pictureAddBindings()" :disabled="props.disabled" @open="openFileDialog">
                    <slot />
                </AddArea>
            </div>
        </div>
        <AddArea v-else-if="isPicture && showAdd" v-bind="pictureAddBindings()" :disabled="props.disabled" @open="openFileDialog">
            <slot />
        </AddArea>
        <Modal
            v-bind="cropModalRest()"
            :bodyStyle="[{ height: '400px' }, props.cropModalProps?.bodyStyle]"
            :cancelText="cropConfig.modalCancelText"
            :okText="cropConfig.modalOkText"
            :onCancel="() => foundation.cancelCrop()"
            :onOk="() => foundation.confirmCrop()"
            :style="[{ height: '500px' }, props.cropModalProps?.style]"
            :title="cropConfig.modalTitle || i18n.locale.cropTitle"
            :visible="state.cropperVisible"
            :width="props.cropModalProps?.width ?? 600"
        >
            <!-- a new image mounts a new Cropper: a reused one would keep the zoom of the previous image -->
            <Cropper
                v-if="state.cropperSrc"
                :key="state.cropperSrc"
                ref="cropper"
                :aspectRatio="cropConfig.aspectRatio"
                :fill="cropConfig.fill"
                :maxZoom="cropConfig.maxZoom"
                :minZoom="cropConfig.minZoom"
                :shape="cropConfig.shape || 'rect'"
                :src="state.cropperSrc"
                style="width: 100%; height: 100%"
                :zoomStep="cropConfig.zoomStep"
            />
        </Modal>
    </div>
</template>
