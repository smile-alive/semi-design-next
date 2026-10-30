<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import { getFileType, isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
    import { isUploadProgressVisible } from '@fibrae/semi-ai-foundation/upload-status';
    import { IconAlertCircle, IconClear } from '@fibrae/semi-icons-svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import Progress from '@fibrae/semi-ui-svelte/progress/progress.svelte';
    import type { FileItem } from '@fibrae/semi-ui-svelte/upload/interface';
    import FileAttachment from './file-attachment.svelte';
    import ImageAttachment from './image-attachment.svelte';

    let { attachment, onClear }: { attachment: FileItem[]; onClear: (item: FileItem) => void } = $props();

    const locale = useLocale('Chat');

    const { PREFIX_ATTACHMENT } = cssClasses;
    const { FILE_STATUS } = strings;
    const failed: string[] = [FILE_STATUS.UPLOAD_FAIL, FILE_STATUS.VALID_FAIL];

    const mimeOf = (item: FileItem) => item.fileInstance?.type;
</script>

<div class={PREFIX_ATTACHMENT}>
    {#each attachment as item (item.uid)}
        <div class="{PREFIX_ATTACHMENT}-item">
            {#if isImageFile(item.name, mimeOf(item))}
                <ImageAttachment name={item.name} src={item.url} />
            {:else}
                <FileAttachment name={item.name} size={item.size} type={getFileType(item.name, mimeOf(item))} url={item.url} />
            {/if}
            <button aria-label={locale().locale.removeAttachment} class="{PREFIX_ATTACHMENT}-clear" type="button" onclick={() => onClear(item)}>
                <IconClear size="large" />
            </button>
            {#if isUploadProgressVisible(item)}
                <Progress aria-label={locale().locale.uploadProgress} class="{PREFIX_ATTACHMENT}-process" percent={item.percent} size="small" type="circle" width={30} />
            {/if}
            {#if failed.includes(item.status)}
                <IconAlertCircle class="{PREFIX_ATTACHMENT}-fail" />
            {/if}
        </div>
    {/each}
</div>
