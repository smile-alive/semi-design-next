<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-foundation/upload/constants';
    import { getFileSize } from '@fibrae/semi-foundation/upload/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/upload/upload.scss';
    import { IconAlertCircle, IconClear, IconClose, IconFile, IconRefresh } from '@fibrae/semi-icons-svelte';
    import Button from '../button/button.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import Progress from '../progress/progress.svelte';
    import Spin from '../spin/spin.svelte';
    import Tooltip from '../tooltip/tooltip.svelte';
    import TypographyText from '../typography/text.svelte';
    import type { FileCardProps, UploadFileItemSlotProps } from './interface.js';

    // A static subcomponent: it reads no global defaults.
    let {
        file,
        index,
        listType = 'list',
        disabled,
        showRetry,
        showReplace,
        showPicInfo,
        showTooltip = true,
        picWidth,
        picHeight,
        validateMessage,
        onPreviewClick,
        onRemove,
        onReplace,
        onRetry,
        ellipsisTooltip,
        fileOperation,
        fileValidateMessage,
        picClose,
        picInfo,
        picPreviewIcon,
        previewFile,
        thumbnail,
        ...rest
    }: FileCardProps = $props();

    const locale = useLocale('Upload');

    // The failed url is kept instead of a flag so a new url (e.g. a server thumbnail replacing a blob url) gets its own try
    let failedUrl = $state<string>();

    const prefix = cssClasses.PREFIX;
    const info = `${prefix}-file-card-info`;
    const fallbackPreview = $derived(failedUrl !== undefined && failedUrl === file.url);
    const message = $derived(validateMessage ?? file.validateMessage);
    const retryEnabled = $derived(file.showRetry ?? showRetry);
    const replaceEnabled = $derived(file.showReplace ?? showReplace);
    const retryShown = $derived(!disabled && file.status === strings.FILE_STATUS_UPLOAD_FAIL && Boolean(retryEnabled));
    const replaceShown = $derived(!disabled && file.status === strings.FILE_STATUS_SUCCESS && Boolean(replaceEnabled));
    const failed = $derived(file.status === strings.FILE_STATUS_VALID_FAIL || file.status === strings.FILE_STATUS_UPLOAD_FAIL);

    // an item built by hand may carry the byte count
    const size = $derived.by(() => {
        const value: string | number = file.size;
        return typeof value === 'number' ? getFileSize(value) : value;
    });

    const nameEllipsis = $derived({ showTooltip });

    // Unset keys must be absent so a consumer's style is not blanked
    const sizeStyle = $derived([picHeight ? `height: ${toCssLength(picHeight)}` : '', picWidth ? `width: ${toCssLength(picWidth)}` : ''].filter(Boolean).join(';'));

    // Shortcut: a snippet cannot be asked whether it renders anything, so the icon follows the message text only;
    // `fileValidateMessage` replaces the text inside the tooltip and gets the message as `validateMessage`.
    const validateIcon = $derived(message ? (file.status === strings.FILE_STATUS_VALIDATING ? 'loading' : failed ? 'error' : undefined) : undefined);

    const slotProps = (): UploadFileItemSlotProps => ({
        file,
        index,
        listType,
        disabled,
        showRetry: retryEnabled,
        showReplace: replaceEnabled,
        showPicInfo,
        showTooltip,
        picWidth,
        picHeight,
        validateMessage: message,
        style: rest.style ?? undefined,
        onRemove: () => onRemove?.(),
        onRetry: () => onRetry?.(),
        onReplace: () => onReplace?.(),
        onPreviewClick,
    });

    const onImageError = () => {
        failedUrl = file.url;
    };

    const removeFromClose = (event: MouseEvent) => {
        event.stopPropagation();
        onRemove?.();
    };
</script>

{#snippet replaceIcon()}
    <svg aria-hidden="true" fill="none" focusable="false" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 17V7.58824C6 7.26336 6.26863 7 6.6 7H10.5L12 8.76471H16.05C16.3814 8.76471 16.65 9.02806 16.65 9.35294V11.1176H7.5L6 17ZM6 17L7.44375 11.1176H18L16.8 17L6 17Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
    </svg>
{/snippet}

{#if listType === strings.FILE_LIST_DEFAULT}
    <div
        {...rest}
        class={[
            `${prefix}-file-card`,
            rest.class,
            {
                [`${prefix}-file-card-fail`]: failed,
                [`${prefix}-file-card-show-pointer`]: onPreviewClick !== undefined,
            },
        ]}
        role="listitem"
        onclick={() => onPreviewClick?.()}
    >
        {#if onPreviewClick}
            <!-- Keyboard-only: Enter here bubbles a click to the card, which opens the preview for the mouse too -->
            <button aria-label={locale().locale.preview} class={`${prefix}-preview-trigger`} type="button"></button>
        {/if}
        <div
            class={[
                `${prefix}-file-card-preview`,
                {
                    [`${prefix}-file-card-preview-placeholder`]: !file.preview || previewFile || fallbackPreview,
                },
            ]}
        >
            {#if previewFile}
                {@render previewFile(slotProps())}
            {:else if file.preview && !fallbackPreview}
                <img alt="" src={file.url} onerror={onImageError} />
            {:else}
                <IconFile size="large" />
            {/if}
        </div>
        <div class={`${info}-main`}>
            <div class={`${info}-main-text`}>
                <TypographyText class={`${info}-name`} ellipsis={nameEllipsis} {ellipsisTooltip}>{file.name}</TypographyText>
                <span>
                    <span class={`${info}-size`}>{size}</span>
                    {#if replaceShown}
                        <!-- the Button is the trigger itself, so it stays the only Tab stop -->
                        <Tooltip position="top" showArrow={false} trigger="hover">
                            {#snippet child({ props })}
                                <Button
                                    {...props}
                                    aria-label={locale().locale.replace}
                                    class={`${prefix}-file-card-replace`}
                                    size="small"
                                    theme="borderless"
                                    type="tertiary"
                                    onclick={(event) => {
                                        event.stopPropagation();
                                        onReplace?.();
                                    }}
                                >
                                    {#snippet icon()}{@render replaceIcon()}{/snippet}
                                </Button>
                            {/snippet}
                            {#snippet content()}{locale().locale.replace}{/snippet}
                        </Tooltip>
                    {/if}
                </span>
            </div>
            {#if file.status === strings.FILE_STATUS_UPLOADING && file.percent !== undefined && file.percent !== 100}
                <Progress aria-label={locale().locale.uploadProgress} percent={file.percent} style="width: 100%" />
            {/if}
            <div class={`${info}-main-control`}>
                <span class={`${info}-validate-message`}>
                    {#if fileValidateMessage}
                        {@render fileValidateMessage(slotProps())}
                    {:else if typeof message === 'string'}
                        {#if file.status === strings.FILE_STATUS_VALIDATING}
                            <Spin size="small" wrapperClassName={`${prefix}-file-card-icon-loading`} />
                        {:else}
                            <IconAlertCircle class={`${prefix}-file-card-icon-error`} />
                        {/if}
                        {message}
                    {/if}
                </span>
                {#if retryShown}
                    <button
                        class={`${info}-retry`}
                        type="button"
                        onclick={(event) => {
                            event.stopPropagation();
                            onRetry?.();
                        }}
                    >
                        {locale().locale.retry}
                    </button>
                {/if}
            </div>
        </div>
        {#if fileOperation}
            {@render fileOperation(slotProps())}
        {:else if !disabled}
            <Button
                aria-label={locale().locale.remove}
                class={`${prefix}-file-card-close`}
                size="small"
                theme="borderless"
                type="tertiary"
                onclick={(event) => {
                    event.stopPropagation();
                    onRemove?.();
                }}
            >
                {#snippet icon()}<IconClose />{/snippet}
            </Button>
        {/if}
    </div>
{:else if listType === strings.FILE_LIST_PIC}
    <div
        {...rest}
        class={[
            `${prefix}-picture-file-card`,
            rest.class,
            {
                [`${prefix}-picture-file-card-preview-fallback`]: fallbackPreview,
                [`${prefix}-picture-file-card-disabled`]: disabled,
                [`${prefix}-picture-file-card-show-pointer`]: onPreviewClick !== undefined,
                [`${prefix}-picture-file-card-error`]: file.status === strings.FILE_STATUS_UPLOAD_FAIL,
                [`${prefix}-picture-file-card-uploading`]: file.status === strings.FILE_STATUS_UPLOADING && file.percent !== 100,
                [`${prefix}-picture-file-card-custom-thumbnail`]: thumbnail && picHeight && picWidth,
            },
        ]}
        role="listitem"
        style={[rest.style, sizeStyle].filter(Boolean).join(';') || undefined}
        onclick={() => onPreviewClick?.()}
    >
        {#if thumbnail}
            {@render thumbnail(slotProps())}
        {:else if !fallbackPreview}
            <img alt={file.name} src={file.url} style={sizeStyle || undefined} onerror={onImageError} />
        {:else}
            <IconFile size="large" />
        {/if}
        {#if onPreviewClick}
            <button aria-label={locale().locale.preview} class={`${prefix}-preview-trigger`} type="button"></button>
        {/if}
        {#if file.status === strings.FILE_STATUS_UPLOADING && file.percent !== 100}
            <Progress aria-label={locale().locale.uploadProgress} orbitStroke="var(--semi-color-white)" percent={file.percent} size="small" type="circle" />
        {/if}
        {#if retryShown}
            <button
                aria-label={locale().locale.retry}
                class={`${prefix}-picture-file-card-retry`}
                type="button"
                onclick={(event) => {
                    event.stopPropagation();
                    onRetry?.();
                }}
            >
                <IconRefresh class={`${prefix}-picture-file-card-icon-retry`} />
            </button>
        {/if}
        {#if replaceShown}
            <Tooltip position="top" showArrow={false} spacing={4} trigger="hover">
                {#snippet child({ props })}
                    <button
                        {...props}
                        aria-label={locale().locale.replace}
                        class={`${prefix}-picture-file-card-replace`}
                        type="button"
                        onclick={(event) => {
                            event.stopPropagation();
                            onReplace?.();
                        }}
                    >
                        <svg aria-hidden="true" class={`${prefix}-picture-file-card-icon-replace`} fill="none" focusable="false" height="28" viewBox="0 0 28 28" width="28" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="14" cy="14" fill="#16161A" fill-opacity="0.6" r="14" />
                            <path d="M9 10.25V18.25L10.25 13.25H17.875V11.75C17.875 11.4739 17.6511 11.25 17.375 11.25H14L12.75 9.75H9.5C9.22386 9.75 9 9.97386 9 10.25Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M18 18.25L19 13.25H10.2031L9 18.25H18Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                {/snippet}
                {#snippet content()}{locale().locale.replace}{/snippet}
            </Tooltip>
        {/if}
        {#if file.status === strings.FILE_STATUS_SUCCESS && !replaceShown}
            <div class={`${prefix}-picture-file-card-preview`}>
                {@render picPreviewIcon?.(slotProps())}
            </div>
        {/if}
        {#if showPicInfo}
            {#if picInfo}
                {@render picInfo(slotProps())}
            {:else}
                <div class={`${prefix}-picture-file-card-pic-info`}>{(index ?? 0) + 1}</div>
            {/if}
        {/if}
        {#if !disabled}
            {#if picClose}
                {@render picClose({ class: `${prefix}-picture-file-card-close`, onRemove: removeFromClose })}
            {:else}
                <button aria-label={locale().locale.remove} class={`${prefix}-picture-file-card-close`} type="button" onclick={removeFromClose}>
                    <IconClear class={`${prefix}-picture-file-card-icon-close`} />
                </button>
            {/if}
        {/if}
        {#if validateIcon}
            <Tooltip position="bottom" trigger="hover">
                {#snippet child({ props })}
                    {#if validateIcon === 'loading'}
                        <span {...props} class={[`${prefix}-tooltip-children-wrapper`, `${prefix}-picture-file-card-icon-loading`]}>
                            <Spin size="small" />
                        </span>
                    {:else}
                        <div {...props} class={`${prefix}-picture-file-card-icon-error`}>
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
                    {/if}
                {/snippet}
                {#snippet content()}
                    {#if fileValidateMessage}
                        {@render fileValidateMessage(slotProps())}
                    {:else}
                        {message}
                    {/if}
                {/snippet}
            </Tooltip>
        {/if}
    </div>
{/if}
