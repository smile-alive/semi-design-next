<script lang="ts">
    import { cssClasses, getDialogueFileKind, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { InputFile } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { getFileType } from '@fibrae/semi-ai-foundation/file-suffix';
    import { IconCode, IconExcel, IconFile, IconPdf, IconSendMsgStroked, IconVideo, IconWord } from '@fibrae/semi-icons-svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { getAIChatDialogueContext } from './context.js';

    let { file, role, isLastFile }: { file: InputFile; role: string; isLastFile: boolean } = $props();

    const { view, fileClick, referenceClick } = getAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { PREFIX_CONTENT } = cssClasses;
    const ICONS = { word: IconWord, pdf: IconPdf, excel: IconExcel, code: IconCode, video: IconVideo, default: IconFile };
    const realType = $derived(getFileType(file.filename, file.fileInstance?.type));
    const kind = $derived(getDialogueFileKind(realType) ?? 'default');
    const Icon = $derived(kind === 'image' ? undefined : ICONS[kind]);
    const showReference = $derived(role === strings.ROLE.USER && view.showReference);

    const onClick = (event: MouseEvent) => {
        fileClick(file);
        if (view.disabledFileItemClick) {
            event.preventDefault();
        }
    };

    const onReference = (event: Event) => {
        referenceClick({ name: file.filename, url: file.file_url });
        // cancel the default: the card link must not open, and Space must not scroll
        event.preventDefault();
    };

    const onReferenceKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            onReference(event);
        }
    };
</script>

<a class={[`${PREFIX_CONTENT}-file`, { [`${PREFIX_CONTENT}-file-last`]: isLastFile }]} href={file.file_url} rel="noopener noreferrer" target="_blank" onclick={onClick}>
    <div class={[`${PREFIX_CONTENT}-file-icon-wrapper`, `${PREFIX_CONTENT}-file-icon-${kind}`]}>
        {#if Icon}
            <Icon class="{PREFIX_CONTENT}-file-icon" size="extra-large" />
        {:else}
            <div class="{PREFIX_CONTENT}-file-icon" style:background-image="url({file.file_url})"></div>
        {/if}
    </div>
    <div class="{PREFIX_CONTENT}-file-info">
        <span class={[`${PREFIX_CONTENT}-file-title`, { [`${PREFIX_CONTENT}-file-title-ellipsis`]: showReference }]}>{file.filename}</span>
        <span class="{PREFIX_CONTENT}-file-metadata">
            <span class="{PREFIX_CONTENT}-file-type">{realType}</span>
            {file.size}
        </span>
    </div>
    {#if showReference}
        <!-- shortcut: role="button" div, as a native button cannot nest in <a>; move it beside the link on rework -->
        <div aria-label={locale().locale.reference} class="{PREFIX_CONTENT}-icon-reference" role="button" tabindex="0" onclick={onReference} onkeydown={onReferenceKeydown}>
            <IconSendMsgStroked />
        </div>
    {/if}
</a>
