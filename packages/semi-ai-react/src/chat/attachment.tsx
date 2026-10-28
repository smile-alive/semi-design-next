import React from 'react';
import clsx from 'clsx';
import { strings, cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
import { getFileType, isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
import { isUploadProgressVisible } from '@fibrae/semi-ai-foundation/upload-status';
import { IconAlertCircle, IconBriefStroked, IconClear } from '@fibrae/semi-icons-react';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import Image from '@fibrae/semi-ui-react/image/index';
import Progress from '@fibrae/semi-ui-react/progress/index';
import type { FileItem } from '@fibrae/semi-ui-react/upload/interface';

const { PREFIX_ATTACHMENT } = cssClasses;

interface AttachmentProps {
    className?: string;
    attachment?: FileItem[];
    onClear?: (item: FileItem) => void;
    showClear?: boolean;
}

interface FileItemProps {
    url?: string;
    name?: string;
    size?: string;
    type?: string;
}

export const FileAttachment = React.memo(function FileAttachment({ url, name, size, type }: FileItemProps) {
    return (
        <a className={`${PREFIX_ATTACHMENT}-file`} href={url} rel="noreferrer" target="_blank">
            <IconBriefStroked className={`${PREFIX_ATTACHMENT}-file-icon`} size="extra-large" />
            <div className={`${PREFIX_ATTACHMENT}-file-info`}>
                <span className={`${PREFIX_ATTACHMENT}-file-title`}>{name}</span>
                <span className={`${PREFIX_ATTACHMENT}-file-metadata`}>
                    <span className={`${PREFIX_ATTACHMENT}-file-type`}>{type}</span>
                    {type ? ' · ' : ''}
                    {size}
                </span>
            </div>
        </a>
    );
});

// markdown's img passes an alt and an attachment its file name; either names the image better than the generic text
export const ImageAttachment = React.memo(function ImageAttachment({ src, alt, name }: { src: string; alt?: string; name?: string }) {
    const { locale } = useLocale('Chat');
    return <Image className={`${PREFIX_ATTACHMENT}-img`} alt={alt || name || locale.image} height={60} src={src} width={60} />;
});

function Attachment({ attachment, onClear, showClear = true, className }: AttachmentProps) {
    const { locale } = useLocale('Chat');

    return (
        <div className={clsx(PREFIX_ATTACHMENT, { [className]: className })}>
            {attachment.map((item) => {
                const mime = item.fileInstance?.type;
                return (
                    <div key={item.uid} className={`${PREFIX_ATTACHMENT}-item`}>
                        {isImageFile(item.name, mime) ? <ImageAttachment name={item.name} src={item.url} /> : <FileAttachment name={item.name} type={getFileType(item.name, mime)} size={item.size} url={item.url} />}
                        {showClear && (
                            <button type="button" className={`${PREFIX_ATTACHMENT}-clear`} aria-label={locale.removeAttachment} onClick={() => onClear?.(item)}>
                                <IconClear size="large" />
                            </button>
                        )}
                        {isUploadProgressVisible(item) && <Progress type="circle" className={`${PREFIX_ATTACHMENT}-process`} aria-label={locale.uploadProgress} percent={item.percent} size="small" width={30} />}
                        {[strings.FILE_STATUS.UPLOAD_FAIL, strings.FILE_STATUS.VALID_FAIL].includes(item.status) && <IconAlertCircle className={`${PREFIX_ATTACHMENT}-fail`} />}
                    </div>
                );
            })}
        </div>
    );
}

export default React.memo(Attachment);
