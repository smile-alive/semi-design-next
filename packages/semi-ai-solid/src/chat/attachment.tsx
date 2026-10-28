import { For, Show, createMemo, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
import { getFileType, isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
import { isUploadProgressVisible } from '@fibrae/semi-ai-foundation/upload-status';
import { IconAlertCircle, IconBriefStroked, IconClear } from '@fibrae/semi-icons-solid';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import Image from '@fibrae/semi-ui-solid/image/index';
import Progress from '@fibrae/semi-ui-solid/progress/index';
import type { FileItem } from '@fibrae/semi-ui-solid/upload/index';

const { PREFIX_ATTACHMENT } = cssClasses;
const failStatuses: string[] = [strings.FILE_STATUS.UPLOAD_FAIL, strings.FILE_STATUS.VALID_FAIL];

interface AttachmentProps {
    class?: string;
    attachment: FileItem[];
    onClear?: (item: FileItem) => void;
}

interface FileAttachmentProps {
    url?: string;
    name?: string;
    size?: string;
    type?: string;
}

export function FileAttachment(props: FileAttachmentProps) {
    return (
        <a class={`${PREFIX_ATTACHMENT}-file`} href={props.url} rel="noreferrer" target="_blank">
            <IconBriefStroked class={`${PREFIX_ATTACHMENT}-file-icon`} size="extra-large" />
            <div class={`${PREFIX_ATTACHMENT}-file-info`}>
                <span class={`${PREFIX_ATTACHMENT}-file-title`}>{props.name}</span>
                <span class={`${PREFIX_ATTACHMENT}-file-metadata`}>
                    <span class={`${PREFIX_ATTACHMENT}-file-type`}>{props.type}</span>
                    {props.type ? ' · ' : ''}
                    {props.size}
                </span>
            </div>
        </a>
    );
}

// markdown's img passes an alt and an attachment its file name; either names the image better than the generic text
export function ImageAttachment(props: { src?: string; alt?: string; name?: string }) {
    const locale = useLocale('Chat');

    return <Image class={`${PREFIX_ATTACHMENT}-img`} alt={props.alt || props.name || locale().locale.image} height={60} src={props.src} width={60} />;
}

export default function Attachment(props: AttachmentProps) {
    const locale = useLocale('Chat');

    const uids = () => props.attachment.map((item) => item.uid);

    const renderItem = (uid: string) => {
        // a row keeps its last item while the list it left is still being removed
        const find = () => props.attachment.find((item) => item.uid === uid);
        const item = createMemo<FileItem>((prev) => find() ?? prev, untrack(find) as FileItem);
        const mime = () => item().fileInstance?.type;
        return (
            <div class={`${PREFIX_ATTACHMENT}-item`}>
                <Show when={isImageFile(item().name, mime())} fallback={<FileAttachment name={item().name} type={getFileType(item().name, mime())} size={item().size} url={item().url} />}>
                    <ImageAttachment name={item().name} src={item().url} />
                </Show>
                <button type="button" class={`${PREFIX_ATTACHMENT}-clear`} aria-label={locale().locale.removeAttachment} onClick={() => props.onClear?.(item())}>
                    <IconClear size="large" />
                </button>
                <Show when={isUploadProgressVisible(item())}>
                    <Progress type="circle" class={`${PREFIX_ATTACHMENT}-process`} aria-label={locale().locale.uploadProgress} percent={item().percent} size="small" width={30} />
                </Show>
                <Show when={failStatuses.includes(item().status)}>
                    <IconAlertCircle class={`${PREFIX_ATTACHMENT}-fail`} />
                </Show>
            </div>
        );
    };

    return (
        <div class={clsx(PREFIX_ATTACHMENT, props.class)}>
            <For each={uids()}>{renderItem}</For>
        </div>
    );
}
