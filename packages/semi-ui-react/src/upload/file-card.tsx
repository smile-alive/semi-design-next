import { isValidElement, useState, type ReactNode, type MouseEvent, type CSSProperties, type SVGProps } from 'react';
import clsx from 'clsx';
import { pickBy } from 'es-toolkit';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { cssClasses, strings } from '@fibrae/semi-foundation/upload/constants';
import { getFileSize } from '@fibrae/semi-foundation/upload/utils';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { IconAlertCircle, IconClose, IconClear, IconFile, IconRefresh } from '@fibrae/semi-icons-react';
import Button from '../button/index';
import useLocale from '../locale/use-locale';
import Progress from '../progress/index';
import Spin from '../spin/index';
import Tooltip from '../tooltip/index';
import Typography from '../typography';
import type { RenderFileItemProps } from './interface';

const prefixCls = cssClasses.PREFIX;

function ErrorSvg(props: SVGProps<SVGSVGElement>) {
    return (
        <svg aria-hidden fill="none" focusable={false} height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx="7.99992" cy="7.99992" fill="white" r="6.66667" />
            <path
                clipRule="evenodd"
                d="M15.3332 8.00008C15.3332 12.0502 12.0499 15.3334 7.99984 15.3334C3.94975 15.3334 0.666504 12.0502 0.666504 8.00008C0.666504 3.94999 3.94975 0.666748 7.99984 0.666748C12.0499 0.666748 15.3332 3.94999 15.3332 8.00008ZM8.99984 11.6667C8.99984 11.1145 8.55212 10.6667 7.99984 10.6667C7.44755 10.6667 6.99984 11.1145 6.99984 11.6667C6.99984 12.219 7.44755 12.6667 7.99984 12.6667C8.55212 12.6667 8.99984 12.219 8.99984 11.6667ZM7.99984 3.33341C7.27573 3.33341 6.7003 3.94171 6.74046 4.66469L6.94437 8.33495C6.97549 8.89513 7.4388 9.33341 7.99984 9.33341C8.56087 9.33341 9.02419 8.89513 9.05531 8.33495L9.25921 4.66469C9.29938 3.94171 8.72394 3.33341 7.99984 3.33341Z"
                fill="#F93920"
                fillRule="evenodd"
            />
        </svg>
    );
}

function ReplaceSvg(props: SVGProps<SVGSVGElement>) {
    return (
        <svg aria-hidden fill="none" focusable={false} height="28" viewBox="0 0 28 28" width="28" xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx="14" cy="14" fill="#16161A" fillOpacity="0.6" r="14" />
            <path d="M9 10.25V18.25L10.25 13.25H17.875V11.75C17.875 11.4739 17.6511 11.25 17.375 11.25H14L12.75 9.75H9.5C9.22386 9.75 9 9.97386 9 10.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 18.25L19 13.25H10.2031L9 18.25H18Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function DirectorySvg(props: SVGProps<SVGSVGElement>) {
    return (
        <svg aria-hidden fill="none" focusable={false} height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M6 17V7.58824C6 7.26336 6.26863 7 6.6 7H10.5L12 8.76471H16.05C16.3814 8.76471 16.65 9.02806 16.65 9.35294V11.1176H7.5L6 17ZM6 17L7.44375 11.1176H18L16.8 17L6 17Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
    );
}

export interface FileCardProps extends RenderFileItemProps {
    className?: string;
    style?: CSSProperties;
}

const defaultProps = {
    listType: strings.FILE_LIST_DEFAULT,
    name: '',
    onRemove: noop,
    onRetry: noop,
    preview: false,
    size: '',
    showTooltip: true,
} satisfies Partial<FileCardProps>;

function withDefaults(rawProps: FileCardProps): FileCardProps {
    const missing = Object.entries(defaultProps).filter(([key]) => Reflect.get(rawProps, key) === undefined);
    return { ...rawProps, ...Object.fromEntries(missing) };
}

function transSize(size: string | number) {
    return typeof size === 'number' ? getFileSize(size) : size;
}

function renderValidateMessage({ status, validateMessage }: FileCardProps): ReactNode {
    if (typeof validateMessage === 'string' && status === strings.FILE_STATUS_VALIDATING) {
        return (
            <>
                <Spin wrapperClassName={`${prefixCls}-file-card-icon-loading`} size="small" />
                {validateMessage}
            </>
        );
    }
    if (typeof validateMessage === 'string') {
        return (
            <>
                <IconAlertCircle className={`${prefixCls}-file-card-icon-error`} />
                {validateMessage}
            </>
        );
    }
    return isValidElement(validateMessage) ? validateMessage : null;
}

function renderPicValidateMsg({ status, validateMessage }: FileCardProps): ReactNode {
    let icon: ReactNode = null;
    if (validateMessage && status === strings.FILE_STATUS_VALIDATING) {
        icon = (
            <span className={`${prefixCls}-tooltip-children-wrapper ${prefixCls}-picture-file-card-icon-loading`}>
                <Spin size="small" />
            </span>
        );
    } else if (validateMessage && (status === strings.FILE_STATUS_VALID_FAIL || status === strings.FILE_STATUS_UPLOAD_FAIL)) {
        icon = (
            <div className={`${prefixCls}-picture-file-card-icon-error`}>
                <ErrorSvg />
            </div>
        );
    }
    return icon ? (
        <Tooltip content={validateMessage} position="bottom" trigger="hover">
            {icon}
        </Tooltip>
    ) : null;
}

// props carry every file-item field, so only data-* and aria-* may reach the DOM
function pickDataAriaProps(props: FileCardProps): Record<string, unknown> {
    return pickBy(props, (_, key) => key.startsWith('data-') || key.startsWith('aria-'));
}

// Keyboard-only: Enter bubbles a click to the card's handler;
// ignoring the pointer keeps a custom thumbnail's clicks reachable
function PreviewTrigger({ label }: { label: string }) {
    return <button type="button" className={`${prefixCls}-preview-trigger`} aria-label={label} />;
}

function stopThen(callback: () => void) {
    return (e: MouseEvent) => {
        e.stopPropagation();
        callback();
    };
}

function renderPic(props: FileCardProps, locale: Locale['Upload'], fallbackPreview: boolean, onImageError: () => void): ReactNode {
    const { url, percent, status, disabled, style, onPreviewClick, showPicInfo, renderPicInfo, renderPicClose, renderPicPreviewIcon, renderThumbnail, name, index, picHeight, picWidth } = props;
    const onRemove = stopThen(props.onRemove);
    const showProgress = status === strings.FILE_STATUS_UPLOADING && percent !== 100;
    const showRetry = !disabled && status === strings.FILE_STATUS_UPLOAD_FAIL && props.showRetry;
    const showReplace = !disabled && status === strings.FILE_STATUS_SUCCESS && props.showReplace;
    const showPreview = status === strings.FILE_STATUS_SUCCESS && !showReplace;
    const customThumbnail = typeof renderThumbnail === 'function';
    const filePicCardCls = clsx({
        [`${prefixCls}-picture-file-card`]: true,
        [`${prefixCls}-picture-file-card-preview-fallback`]: fallbackPreview,
        [`${prefixCls}-picture-file-card-disabled`]: disabled,
        [`${prefixCls}-picture-file-card-show-pointer`]: typeof onPreviewClick !== 'undefined',
        [`${prefixCls}-picture-file-card-error`]: status === strings.FILE_STATUS_UPLOAD_FAIL,
        [`${prefixCls}-picture-file-card-uploading`]: showProgress,
        [`${prefixCls}-picture-file-card-custom-thumbnail`]: customThumbnail && picHeight && picWidth,
    });
    const retry = (
        <button type="button" className={`${prefixCls}-picture-file-card-retry`} aria-label={locale.retry} onClick={stopThen(props.onRetry)}>
            <IconRefresh className={`${prefixCls}-picture-file-card-icon-retry`} />
        </button>
    );
    const replace = (
        <Tooltip content={locale.replace} position="top" showArrow={false} spacing={4} trigger="hover">
            <button type="button" className={`${prefixCls}-picture-file-card-replace`} aria-label={locale.replace} onClick={stopThen(props.onReplace)}>
                <ReplaceSvg className={`${prefixCls}-picture-file-card-icon-replace`} />
            </button>
        </Tooltip>
    );
    const preview = <div className={`${prefixCls}-picture-file-card-preview`}>{typeof renderPicPreviewIcon === 'function' && renderPicPreviewIcon(props)}</div>;
    const close =
        typeof renderPicClose === 'function' ? (
            renderPicClose({ className: `${prefixCls}-picture-file-card-close`, remove: onRemove })
        ) : (
            <button type="button" className={`${prefixCls}-picture-file-card-close`} aria-label={locale.remove} onClick={onRemove}>
                <IconClear className={`${prefixCls}-picture-file-card-icon-close`} />
            </button>
        );
    const picInfo = typeof renderPicInfo === 'function' ? renderPicInfo(props) : <div className={`${prefixCls}-picture-file-card-pic-info`}>{index + 1}</div>;

    const imgStyle: { height?: number | string; width?: number | string } = {};
    const itemStyle: CSSProperties = style ? { ...style } : {};
    if (picHeight) {
        itemStyle.height = picHeight;
        imgStyle.height = picHeight;
    }
    if (picWidth) {
        itemStyle.width = picWidth;
        imgStyle.width = picWidth;
    }
    const defaultThumbnail = !fallbackPreview ? <img style={imgStyle} alt={name} src={url} onError={onImageError} /> : <IconFile size="large" />;
    const thumbnail = customThumbnail ? renderThumbnail(props) : defaultThumbnail;

    return (
        <div {...pickDataAriaProps(props)} className={filePicCardCls} style={itemStyle} role="listitem" onClick={onPreviewClick}>
            {thumbnail}
            {onPreviewClick && <PreviewTrigger label={locale.preview} />}
            {showProgress && <Progress type="circle" aria-label={locale.uploadProgress} orbitStroke="var(--semi-color-white)" percent={percent} size="small" />}
            {showRetry && retry}
            {showReplace && replace}
            {showPreview && preview}
            {showPicInfo && picInfo}
            {!disabled && close}
            {renderPicValidateMsg(props)}
        </div>
    );
}

function renderFile(props: FileCardProps, locale: Locale['Upload'], fallbackPreview: boolean, onImageError: () => void): ReactNode {
    const { name, size, percent, url, disabled, preview, previewFile, status, style, onPreviewClick, renderFileOperation, showTooltip } = props;
    const fileCardCls = clsx({
        [`${prefixCls}-file-card`]: true,
        [`${prefixCls}-file-card-fail`]: status === strings.FILE_STATUS_VALID_FAIL || status === strings.FILE_STATUS_UPLOAD_FAIL,
        [`${prefixCls}-file-card-show-pointer`]: typeof onPreviewClick !== 'undefined',
    });
    const previewCls = clsx({
        [`${prefixCls}-file-card-preview`]: true,
        [`${prefixCls}-file-card-preview-placeholder`]: !preview || previewFile || fallbackPreview,
    });
    const infoCls = `${prefixCls}-file-card-info`;
    const showProgress = !(percent === 100 || typeof percent === 'undefined') && status === strings.FILE_STATUS_UPLOADING;
    const showRetry = !disabled && status === strings.FILE_STATUS_UPLOAD_FAIL && props.showRetry;
    const showReplace = !disabled && status === strings.FILE_STATUS_SUCCESS && props.showReplace;
    let previewContent: ReactNode = preview && !fallbackPreview ? <img alt="" src={url} onError={onImageError} /> : <IconFile size="large" />;
    if (previewFile) {
        previewContent = previewFile(props);
    }
    let operation: ReactNode = null;
    if (typeof renderFileOperation === 'function') {
        operation = renderFileOperation(props);
    } else if (!disabled) {
        operation = <Button type="tertiary" className={`${prefixCls}-file-card-close`} aria-label={locale.remove} size="small" theme="borderless" icon={<IconClose />} onClick={stopThen(props.onRemove)} />;
    }
    return (
        <div {...pickDataAriaProps(props)} className={fileCardCls} style={style} role="listitem" onClick={onPreviewClick}>
            {onPreviewClick && <PreviewTrigger label={locale.preview} />}
            <div className={previewCls}>{previewContent}</div>
            <div className={`${infoCls}-main`}>
                <div className={`${infoCls}-main-text`}>
                    <Typography.Text className={`${infoCls}-name`} ellipsis={{ showTooltip }}>
                        {name}
                    </Typography.Text>
                    <span>
                        <span className={`${infoCls}-size`}>{transSize(size)}</span>
                        {showReplace && (
                            <Tooltip content={locale.replace} position="top" showArrow={false} trigger="hover">
                                <Button type="tertiary" className={`${prefixCls}-file-card-replace`} aria-label={locale.replace} size="small" theme="borderless" icon={<DirectorySvg />} onClick={stopThen(props.onReplace)} />
                            </Tooltip>
                        )}
                    </span>
                </div>
                {showProgress && <Progress style={{ width: '100%' }} aria-label={locale.uploadProgress} percent={percent} />}
                <div className={`${infoCls}-main-control`}>
                    <span className={`${infoCls}-validate-message`}>{renderValidateMessage(props)}</span>
                    {showRetry && (
                        <button type="button" className={`${infoCls}-retry`} onClick={stopThen(props.onRetry)}>
                            {locale.retry}
                        </button>
                    )}
                </div>
            </div>
            {operation}
        </div>
    );
}

export default function FileCard(rawProps: FileCardProps) {
    const props = withDefaults(rawProps);

    const { locale } = useLocale('Upload');

    // the failed url, not a flag, so a replacement url (server thumbnail for a blob url) gets its own attempt
    const [failedUrl, setFailedUrl] = useState<string>();

    const fallbackPreview = failedUrl !== undefined && failedUrl === props.url;

    const onImageError = () => setFailedUrl(props.url);

    if (props.listType === strings.FILE_LIST_PIC) {
        return renderPic(props, locale, fallbackPreview, onImageError);
    }

    if (props.listType === strings.FILE_LIST_DEFAULT) {
        return renderFile(props, locale, fallbackPreview, onImageError);
    }

    return null;
}
