<script setup lang="ts">
    import { computed, shallowRef, useAttrs, type StyleValue } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/upload/constants';
    import { getFileSize } from '@fibrae/semi-foundation/upload/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/upload/upload.scss';
    import { IconAlertCircle, IconClear, IconClose, IconFile, IconRefresh } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { hasSlotContent } from '../_base/slot-nodes';
    import Button from '../button';
    import useLocale from '../locale/use-locale';
    import Progress from '../progress';
    import Spin from '../spin';
    import Tooltip from '../tooltip';
    import { TypographyText } from '../typography';
    import type { FileCardEmits, FileCardProps, FileCardSlots, UploadFileItemSlotProps } from './interface';

    defineOptions({ name: 'UploadFileCard', inheritAttrs: false });

    // A static subcomponent: it reads no global defaults.
    const props = withDefaults(defineProps<FileCardProps & /* @vue-ignore */ ElementProps<'div', keyof FileCardProps | EmitHandlers<FileCardEmits>>>(), {
        disabled: undefined,
        index: undefined,
        listType: 'list',
        onPreviewClick: undefined,
        picHeight: undefined,
        picWidth: undefined,
        showPicInfo: undefined,
        showReplace: undefined,
        showRetry: undefined,
        showTooltip: true,
        validateMessage: undefined,
    });

    const emit = defineEmits<FileCardEmits>();
    const slots = defineSlots<FileCardSlots>();
    const attrs = useAttrs();

    const i18n = useLocale('Upload');

    // The failed url is kept instead of a flag so a new url (e.g. a server thumbnail replacing a blob url) gets its own try
    const failedUrl = shallowRef<string>();

    const prefix = cssClasses.PREFIX;
    const info = `${prefix}-file-card-info`;
    const fallbackPreview = computed(() => failedUrl.value !== undefined && failedUrl.value === props.file.url);
    const message = computed(() => props.validateMessage ?? props.file.validateMessage);
    const showRetry = computed(() => props.file.showRetry ?? props.showRetry);
    const showReplace = computed(() => props.file.showReplace ?? props.showReplace);
    const retryShown = computed(() => !props.disabled && props.file.status === strings.FILE_STATUS_UPLOAD_FAIL && Boolean(showRetry.value));
    const replaceShown = computed(() => !props.disabled && props.file.status === strings.FILE_STATUS_SUCCESS && Boolean(showReplace.value));
    const failed = computed(() => props.file.status === strings.FILE_STATUS_VALID_FAIL || props.file.status === strings.FILE_STATUS_UPLOAD_FAIL);

    const size = computed(() => {
        const value: string | number = props.file.size;
        return typeof value === 'number' ? getFileSize(value) : value;
    });

    // Unset keys must be absent: an `undefined` value would blank the consumer's style on merge.
    const sizeStyle = computed(() => ({
        ...(props.picHeight ? { height: toCssLength(props.picHeight) } : {}),
        ...(props.picWidth ? { width: toCssLength(props.picWidth) } : {}),
    }));

    const onImageError = () => {
        failedUrl.value = props.file.url;
    };

    const slotProps = (): UploadFileItemSlotProps => ({
        file: props.file,
        index: props.index,
        listType: props.listType,
        disabled: props.disabled,
        showRetry: showRetry.value,
        showReplace: showReplace.value,
        showPicInfo: props.showPicInfo,
        showTooltip: props.showTooltip,
        picWidth: props.picWidth,
        picHeight: props.picHeight,
        validateMessage: message.value,
        style: attrs.style as StyleValue,
        onRemove: () => emit('remove'),
        onRetry: () => emit('retry'),
        onReplace: () => emit('replace'),
        onPreviewClick: props.onPreviewClick,
    });

    const removeFromClose = (e: MouseEvent) => {
        e.stopPropagation();
        emit('remove');
    };

    // Upload forwards one #fileValidateMessage to every card, so only content rendered for this file counts as a message.
    const picValidateIcon = () => {
        if (!message.value && !hasSlotContent(() => slots.validateMessage?.(slotProps()) ?? [])) return undefined;
        if (props.file.status === strings.FILE_STATUS_VALIDATING) return 'loading';
        return failed.value ? 'error' : undefined;
    };
</script>

<template>
    <div
        v-if="props.listType === strings.FILE_LIST_DEFAULT"
        v-bind="$attrs"
        :class="[
            `${prefix}-file-card`,
            {
                [`${prefix}-file-card-fail`]: failed,
                [`${prefix}-file-card-show-pointer`]: props.onPreviewClick !== undefined,
            },
        ]"
        role="listitem"
        @click="props.onPreviewClick?.()"
    >
        <!-- Keyboard-only: Enter here bubbles a click to the card, which opens the preview for the mouse too -->
        <button v-if="props.onPreviewClick" :aria-label="i18n.locale.preview" :class="`${prefix}-preview-trigger`" type="button" />
        <div
            :class="[
                `${prefix}-file-card-preview`,
                {
                    [`${prefix}-file-card-preview-placeholder`]: !props.file.preview || $slots.previewFile || fallbackPreview,
                },
            ]"
        >
            <slot v-if="$slots.previewFile" name="previewFile" v-bind="slotProps()" />
            <img v-else-if="props.file.preview && !fallbackPreview" alt="" :src="props.file.url" @error="onImageError" />
            <IconFile v-else size="large" />
        </div>
        <div :class="`${info}-main`">
            <div :class="`${info}-main-text`">
                <TypographyText :class="`${info}-name`" :ellipsis="{ showTooltip: props.showTooltip }">
                    {{ props.file.name }}
                    <template v-if="$slots.ellipsisTooltip" #ellipsisTooltip="scope">
                        <slot name="ellipsisTooltip" v-bind="scope" />
                    </template>
                </TypographyText>
                <span>
                    <span :class="`${info}-size`">{{ size }}</span>
                    <!-- the Button is the trigger itself, so it stays the only Tab stop -->
                    <Tooltip v-if="replaceShown" position="top" :showArrow="false" trigger="hover">
                        <Button :aria-label="i18n.locale.replace" :class="`${prefix}-file-card-replace`" size="small" theme="borderless" type="tertiary" @click.stop="emit('replace')">
                            <template #icon>
                                <svg aria-hidden="true" fill="none" focusable="false" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 17V7.58824C6 7.26336 6.26863 7 6.6 7H10.5L12 8.76471H16.05C16.3814 8.76471 16.65 9.02806 16.65 9.35294V11.1176H7.5L6 17ZM6 17L7.44375 11.1176H18L16.8 17L6 17Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
                                </svg>
                            </template>
                        </Button>
                        <template #content>{{ i18n.locale.replace }}</template>
                    </Tooltip>
                </span>
            </div>
            <Progress v-if="props.file.status === strings.FILE_STATUS_UPLOADING && props.file.percent !== undefined && props.file.percent !== 100" :aria-label="i18n.locale.uploadProgress" :percent="props.file.percent" style="width: 100%" />
            <div :class="`${info}-main-control`">
                <span :class="`${info}-validate-message`">
                    <slot name="validateMessage" v-bind="slotProps()">
                        <template v-if="typeof message === 'string'">
                            <Spin v-if="props.file.status === strings.FILE_STATUS_VALIDATING" size="small" :wrapperClassName="`${prefix}-file-card-icon-loading`" />
                            <IconAlertCircle v-else :class="`${prefix}-file-card-icon-error`" />
                            {{ message }}
                        </template>
                    </slot>
                </span>
                <button v-if="retryShown" :class="`${info}-retry`" type="button" @click.stop="emit('retry')">
                    {{ i18n.locale.retry }}
                </button>
            </div>
        </div>
        <slot v-if="$slots.fileOperation" name="fileOperation" v-bind="slotProps()" />
        <Button v-else-if="!props.disabled" :aria-label="i18n.locale.remove" :class="`${prefix}-file-card-close`" size="small" theme="borderless" type="tertiary" @click.stop="emit('remove')">
            <template #icon>
                <IconClose />
            </template>
        </Button>
    </div>
    <div
        v-else-if="props.listType === strings.FILE_LIST_PIC"
        v-bind="$attrs"
        :class="[
            `${prefix}-picture-file-card`,
            {
                [`${prefix}-picture-file-card-preview-fallback`]: fallbackPreview,
                [`${prefix}-picture-file-card-disabled`]: props.disabled,
                [`${prefix}-picture-file-card-show-pointer`]: props.onPreviewClick !== undefined,
                [`${prefix}-picture-file-card-error`]: props.file.status === strings.FILE_STATUS_UPLOAD_FAIL,
                [`${prefix}-picture-file-card-uploading`]: props.file.status === strings.FILE_STATUS_UPLOADING && props.file.percent !== 100,
                [`${prefix}-picture-file-card-custom-thumbnail`]: $slots.thumbnail && props.picHeight && props.picWidth,
            },
        ]"
        role="listitem"
        :style="sizeStyle"
        @click="props.onPreviewClick?.()"
    >
        <slot v-if="$slots.thumbnail" name="thumbnail" v-bind="slotProps()" />
        <img v-else-if="!fallbackPreview" :alt="props.file.name" :src="props.file.url" :style="sizeStyle" @error="onImageError" />
        <IconFile v-else size="large" />
        <button v-if="props.onPreviewClick" :aria-label="i18n.locale.preview" :class="`${prefix}-preview-trigger`" type="button" />
        <Progress v-if="props.file.status === strings.FILE_STATUS_UPLOADING && props.file.percent !== 100" :aria-label="i18n.locale.uploadProgress" orbitStroke="var(--semi-color-white)" :percent="props.file.percent" size="small" type="circle" />
        <button v-if="retryShown" :aria-label="i18n.locale.retry" :class="`${prefix}-picture-file-card-retry`" type="button" @click.stop="emit('retry')">
            <IconRefresh :class="`${prefix}-picture-file-card-icon-retry`" />
        </button>
        <Tooltip v-if="replaceShown" position="top" :showArrow="false" :spacing="4" trigger="hover">
            <button :aria-label="i18n.locale.replace" :class="`${prefix}-picture-file-card-replace`" type="button" @click.stop="emit('replace')">
                <svg aria-hidden="true" :class="`${prefix}-picture-file-card-icon-replace`" fill="none" focusable="false" height="28" viewBox="0 0 28 28" width="28" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" fill="#16161A" fill-opacity="0.6" r="14" />
                    <path d="M9 10.25V18.25L10.25 13.25H17.875V11.75C17.875 11.4739 17.6511 11.25 17.375 11.25H14L12.75 9.75H9.5C9.22386 9.75 9 9.97386 9 10.25Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M18 18.25L19 13.25H10.2031L9 18.25H18Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
            <template #content>{{ i18n.locale.replace }}</template>
        </Tooltip>
        <div v-if="props.file.status === strings.FILE_STATUS_SUCCESS && !replaceShown" :class="`${prefix}-picture-file-card-preview`">
            <slot name="picPreviewIcon" v-bind="slotProps()" />
        </div>
        <template v-if="props.showPicInfo">
            <slot v-if="$slots.picInfo" name="picInfo" v-bind="slotProps()" />
            <div v-else :class="`${prefix}-picture-file-card-pic-info`">{{ (props.index ?? 0) + 1 }}</div>
        </template>
        <template v-if="!props.disabled">
            <slot v-if="$slots.picClose" name="picClose" v-bind="{ class: `${prefix}-picture-file-card-close`, onRemove: removeFromClose }" />
            <button v-else :aria-label="i18n.locale.remove" :class="`${prefix}-picture-file-card-close`" type="button" @click.stop="emit('remove')">
                <IconClear :class="`${prefix}-picture-file-card-icon-close`" />
            </button>
        </template>
        <template v-if="picValidateIcon()">
            <Tooltip position="bottom" trigger="hover">
                <span v-if="props.file.status === strings.FILE_STATUS_VALIDATING" :class="[`${prefix}-tooltip-children-wrapper`, `${prefix}-picture-file-card-icon-loading`]">
                    <Spin size="small" />
                </span>
                <div v-else :class="`${prefix}-picture-file-card-icon-error`">
                    <svg aria-hidden="true" fill="none" focusable="false" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="7.99992" cy="7.99992" fill="white" r="6.66667" />
                        <path
                            clip-rule="evenodd"
                            d="M15.3332 8.00008C15.3332 12.0502 12.0499 15.3334 7.99984 15.3334C3.94975 15.3334 0.666504 12.0502 0.666504 8.00008C0.666504 3.94999 3.94975 0.666748 7.99984 0.666748C12.0499 0.666748 15.3332 3.94999 15.3332 8.00008ZM8.99984 11.6667C8.99984 11.1145 8.55212 10.6667 7.99984 10.6667C7.44755 10.6667 6.99984 11.1145 6.99984 11.6667C6.99984 12.219 7.44755 12.6667 7.99984 12.6667C8.55212 12.6667 8.99984 12.219 8.99984 11.6667ZM7.99984 3.33341C7.27573 3.33341 6.7003 3.94171 6.74046 4.66469L6.94437 8.33495C6.97549 8.89513 7.4388 9.33341 7.99984 9.33341C8.56087 9.33341 9.02419 8.89513 9.05531 8.33495L9.25921 4.66469C9.29938 3.94171 8.72394 3.33341 7.99984 3.33341Z"
                            fill="#F93920"
                            fill-rule="evenodd"
                        />
                    </svg>
                </div>
                <template #content>
                    <slot name="validateMessage" v-bind="slotProps()">{{ message }}</slot>
                </template>
            </Tooltip>
        </template>
    </div>
</template>
