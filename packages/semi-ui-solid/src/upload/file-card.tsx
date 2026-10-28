import { type JSX, Match, Show, Switch, children, createSignal } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/upload/constants';
import { getFileSize } from '@fibrae/semi-foundation/upload/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import { IconAlertCircle, IconClear, IconClose, IconFile, IconRefresh } from '@fibrae/semi-icons-solid';
import { splitControlAttrs } from '../_base/control-attrs';
import hasContent from '../_base/has-content';
import Button from '../button';
import useLocale from '../locale/use-locale';
import Progress from '../progress';
import Spin from '../spin';
import Tooltip, { type GetTriggerProps } from '../tooltip';
import Typography from '../typography';
import type { RenderFileItemProps } from './interface';

export type FileCardProps = RenderFileItemProps;

const prefixCls = cssClasses.PREFIX;

function ErrorSvg(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
    return (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx="7.99992" cy="7.99992" fill="white" r="6.66667" />
            <path
                clip-rule="evenodd"
                d="M15.3332 8.00008C15.3332 12.0502 12.0499 15.3334 7.99984 15.3334C3.94975 15.3334 0.666504 12.0502 0.666504 8.00008C0.666504 3.94999 3.94975 0.666748 7.99984 0.666748C12.0499 0.666748 15.3332 3.94999 15.3332 8.00008ZM8.99984 11.6667C8.99984 11.1145 8.55212 10.6667 7.99984 10.6667C7.44755 10.6667 6.99984 11.1145 6.99984 11.6667C6.99984 12.219 7.44755 12.6667 7.99984 12.6667C8.55212 12.6667 8.99984 12.219 8.99984 11.6667ZM7.99984 3.33341C7.27573 3.33341 6.7003 3.94171 6.74046 4.66469L6.94437 8.33495C6.97549 8.89513 7.4388 9.33341 7.99984 9.33341C8.56087 9.33341 9.02419 8.89513 9.05531 8.33495L9.25921 4.66469C9.29938 3.94171 8.72394 3.33341 7.99984 3.33341Z"
                fill="#F93920"
                fill-rule="evenodd"
            />
        </svg>
    );
}

function ReplaceSvg(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
    return (
        <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 28 28" width="28" xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx="14" cy="14" fill="#16161A" fill-opacity="0.6" r="14" />
            <path d="M9 10.25V18.25L10.25 13.25H17.875V11.75C17.875 11.4739 17.6511 11.25 17.375 11.25H14L12.75 9.75H9.5C9.22386 9.75 9 9.97386 9 10.25Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M18 18.25L19 13.25H10.2031L9 18.25H18Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}

function DirectorySvg(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
    return (
        <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M6 17V7.58824C6 7.26336 6.26863 7 6.6 7H10.5L12 8.76471H16.05C16.3814 8.76471 16.65 9.02806 16.65 9.35294V11.1176H7.5L6 17ZM6 17L7.44375 11.1176H18L16.8 17L6 17Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
        </svg>
    );
}

const transSize = (size: string | number) => (typeof size === 'number' ? getFileSize(size) : size);

// props carry every file-item field, so only data-* and aria-* may reach the DOM
const isDataOrAria = (key: string): key is `data-${string}` | `aria-${string}` => key.startsWith('data-') || key.startsWith('aria-');

// the card's own click previews the file
function stopThen(e: MouseEvent, callback?: () => void) {
    e.stopPropagation();
    callback?.();
}

export default function FileCard(props: FileCardProps) {
    const [domAttrs] = splitControlAttrs(props, isDataOrAria);

    const locale = useLocale('Upload');

    // the failed url, not a flag, so a replacement url (server thumbnail for a blob url) gets its own attempt
    const [failedUrl, setFailedUrl] = createSignal<string>();

    const fallbackPreview = () => failedUrl() !== undefined && failedUrl() === props.url;

    const listType = () => props.listType ?? strings.FILE_LIST_DEFAULT;

    const showRetry = () => !props.disabled && props.status === strings.FILE_STATUS_UPLOAD_FAIL && props.showRetry;

    const showReplace = () => !props.disabled && props.status === strings.FILE_STATUS_SUCCESS && props.showReplace;

    const onImageError = () => setFailedUrl(props.url);

    const onRemove = (e: MouseEvent) => stopThen(e, props.onRemove);

    // Keyboard-only: Enter bubbles a click to the card's handler; ignoring the pointer keeps a custom thumbnail's
    // clicks reachable
    const previewTrigger = () => (
        <Show when={props.onPreviewClick}>
            <button type="button" class={`${prefixCls}-preview-trigger`} aria-label={locale().locale.preview} />
        </Show>
    );

    const renderPic = () => {
        const showProgress = () => props.status === strings.FILE_STATUS_UPLOADING && props.percent !== 100;
        const showPreview = () => props.status === strings.FILE_STATUS_SUCCESS && !showReplace();
        const customThumbnail = () => typeof props.renderThumbnail === 'function';
        const sizeStyle = (): JSX.CSSProperties => ({
            ...(props.picHeight ? { height: toCssLength(props.picHeight) } : {}),
            ...(props.picWidth ? { width: toCssLength(props.picWidth) } : {}),
        });
        // The text decides, not renderValidateMessage: its content would be created for the check, while the tooltip
        // that shows it opens only after mount
        const validateIcon = () => {
            if (props.status === strings.FILE_STATUS_VALIDATING) {
                return props.validateMessage ? 'loading' : undefined;
            }
            const failed = props.status === strings.FILE_STATUS_VALID_FAIL || props.status === strings.FILE_STATUS_UPLOAD_FAIL;
            return failed && props.validateMessage ? 'error' : undefined;
        };
        const tooltipContent = () => {
            const custom = children(() => props.renderValidateMessage?.(props));
            return <>{hasContent(custom()) ? custom() : props.validateMessage}</>;
        };
        return (
            <div
                {...domAttrs}
                class={clsx(`${prefixCls}-picture-file-card`, {
                    [`${prefixCls}-picture-file-card-preview-fallback`]: fallbackPreview(),
                    [`${prefixCls}-picture-file-card-disabled`]: props.disabled,
                    [`${prefixCls}-picture-file-card-show-pointer`]: props.onPreviewClick !== undefined,
                    [`${prefixCls}-picture-file-card-error`]: props.status === strings.FILE_STATUS_UPLOAD_FAIL,
                    [`${prefixCls}-picture-file-card-uploading`]: showProgress(),
                    [`${prefixCls}-picture-file-card-custom-thumbnail`]: Boolean(customThumbnail() && props.picHeight && props.picWidth),
                })}
                style={{ ...props.style, ...sizeStyle() }}
                role="listitem"
                onClick={() => props.onPreviewClick?.()}
            >
                <Show
                    keyed
                    when={props.renderThumbnail}
                    fallback={
                        <Show when={!fallbackPreview()} fallback={<IconFile size="large" />}>
                            <img style={sizeStyle()} alt={props.name ?? ''} src={props.url} onError={onImageError} />
                        </Show>
                    }
                >
                    {(render) => render(props)}
                </Show>
                {previewTrigger()}
                <Show when={showProgress()}>
                    <Progress type="circle" aria-label={locale().locale.uploadProgress} orbitStroke="var(--semi-color-white)" percent={props.percent} size="small" />
                </Show>
                <Show when={showRetry()}>
                    <button type="button" class={`${prefixCls}-picture-file-card-retry`} aria-label={locale().locale.retry} onClick={(e) => stopThen(e, props.onRetry)}>
                        <IconRefresh class={`${prefixCls}-picture-file-card-icon-retry`} />
                    </button>
                </Show>
                <Show when={showReplace()}>
                    <Tooltip content={locale().locale.replace} position="top" showArrow={false} spacing={4} trigger="hover">
                        {(getTriggerProps: GetTriggerProps) => (
                            <button {...getTriggerProps({ type: 'button', class: `${prefixCls}-picture-file-card-replace`, 'aria-label': locale().locale.replace })} onClick={(e) => stopThen(e, props.onReplace)}>
                                <ReplaceSvg class={`${prefixCls}-picture-file-card-icon-replace`} />
                            </button>
                        )}
                    </Tooltip>
                </Show>
                <Show when={showPreview()}>
                    <div class={`${prefixCls}-picture-file-card-preview`}>
                        <Show keyed when={props.renderPicPreviewIcon}>
                            {(render) => render(props)}
                        </Show>
                    </div>
                </Show>
                <Show when={props.showPicInfo}>
                    <Show keyed when={props.renderPicInfo} fallback={<div class={`${prefixCls}-picture-file-card-pic-info`}>{(props.index ?? 0) + 1}</div>}>
                        {(render) => render(props)}
                    </Show>
                </Show>
                <Show when={!props.disabled}>
                    <Show
                        keyed
                        when={props.renderPicClose}
                        fallback={
                            <button type="button" class={`${prefixCls}-picture-file-card-close`} aria-label={locale().locale.remove} onClick={onRemove}>
                                <IconClear class={`${prefixCls}-picture-file-card-icon-close`} />
                            </button>
                        }
                    >
                        {(render) => render({ class: `${prefixCls}-picture-file-card-close`, remove: onRemove })}
                    </Show>
                </Show>
                <Show when={validateIcon()}>
                    {(icon) => (
                        <Tooltip content={tooltipContent} position="bottom" trigger="hover">
                            {(getTriggerProps: GetTriggerProps) =>
                                icon() === 'loading' ? (
                                    <span {...getTriggerProps({ class: `${prefixCls}-tooltip-children-wrapper ${prefixCls}-picture-file-card-icon-loading` })}>
                                        <Spin size="small" />
                                    </span>
                                ) : (
                                    <div {...getTriggerProps({ class: `${prefixCls}-picture-file-card-icon-error` })}>
                                        <ErrorSvg />
                                    </div>
                                )
                            }
                        </Tooltip>
                    )}
                </Show>
            </div>
        );
    };

    const renderFile = () => {
        const infoCls = `${prefixCls}-file-card-info`;
        const showProgress = () => !(props.percent === 100 || props.percent === undefined) && props.status === strings.FILE_STATUS_UPLOADING;
        // inserted unless empty, so nothing is created without being shown
        const customMessage = children(() => props.renderValidateMessage?.(props));
        return (
            <div
                {...domAttrs}
                class={clsx(`${prefixCls}-file-card`, {
                    [`${prefixCls}-file-card-fail`]: props.status === strings.FILE_STATUS_VALID_FAIL || props.status === strings.FILE_STATUS_UPLOAD_FAIL,
                    [`${prefixCls}-file-card-show-pointer`]: props.onPreviewClick !== undefined,
                })}
                style={props.style}
                role="listitem"
                onClick={() => props.onPreviewClick?.()}
            >
                {previewTrigger()}
                <div
                    class={clsx(`${prefixCls}-file-card-preview`, {
                        [`${prefixCls}-file-card-preview-placeholder`]: !props.preview || Boolean(props.previewFile) || fallbackPreview(),
                    })}
                >
                    <Show
                        keyed
                        when={props.previewFile}
                        fallback={
                            <Show when={props.preview && !fallbackPreview()} fallback={<IconFile size="large" />}>
                                <img alt="" src={props.url} onError={onImageError} />
                            </Show>
                        }
                    >
                        {(render) => render(props)}
                    </Show>
                </div>
                <div class={`${infoCls}-main`}>
                    <div class={`${infoCls}-main-text`}>
                        <Typography.Text class={`${infoCls}-name`} ellipsis={{ showTooltip: props.showTooltip ?? true }}>
                            {props.name}
                        </Typography.Text>
                        <span>
                            <span class={`${infoCls}-size`}>{transSize(props.size)}</span>
                            <Show when={showReplace()}>
                                <Tooltip content={locale().locale.replace} position="top" showArrow={false} trigger="hover">
                                    {(getTriggerProps: GetTriggerProps) => <Button {...getTriggerProps({ class: `${prefixCls}-file-card-replace`, 'aria-label': locale().locale.replace })} type="tertiary" size="small" theme="borderless" icon={<DirectorySvg />} onClick={(e) => stopThen(e, props.onReplace)} />}
                                </Tooltip>
                            </Show>
                        </span>
                    </div>
                    <Show when={showProgress()}>
                        <Progress style={{ width: '100%' }} aria-label={locale().locale.uploadProgress} percent={props.percent} />
                    </Show>
                    <div class={`${infoCls}-main-control`}>
                        <span class={`${infoCls}-validate-message`}>
                            <Show
                                when={hasContent(customMessage())}
                                fallback={
                                    <Show when={props.validateMessage !== undefined}>
                                        <Show when={props.status === strings.FILE_STATUS_VALIDATING} fallback={<IconAlertCircle class={`${prefixCls}-file-card-icon-error`} />}>
                                            <Spin wrapperClassName={`${prefixCls}-file-card-icon-loading`} size="small" />
                                        </Show>
                                        {props.validateMessage}
                                    </Show>
                                }
                            >
                                {customMessage()}
                            </Show>
                        </span>
                        <Show when={showRetry()}>
                            <button type="button" class={`${infoCls}-retry`} onClick={(e) => stopThen(e, props.onRetry)}>
                                {locale().locale.retry}
                            </button>
                        </Show>
                    </div>
                </div>
                <Show
                    keyed
                    when={props.renderFileOperation}
                    fallback={
                        <Show when={!props.disabled}>
                            <Button type="tertiary" class={`${prefixCls}-file-card-close`} aria-label={locale().locale.remove} size="small" theme="borderless" icon={<IconClose />} onClick={onRemove} />
                        </Show>
                    }
                >
                    {(render) => render(props)}
                </Show>
            </div>
        );
    };

    return (
        <Switch>
            <Match when={listType() === strings.FILE_LIST_PIC}>{renderPic()}</Match>
            <Match when={listType() === strings.FILE_LIST_DEFAULT}>{renderFile()}</Match>
        </Switch>
    );
}
