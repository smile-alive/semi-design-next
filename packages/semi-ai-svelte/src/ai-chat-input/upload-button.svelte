<script lang="ts">
    import { onMount, type Snippet } from 'svelte';
    import { omit } from 'es-toolkit';
    import type { Attachment } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
    import { Tooltip } from '@fibrae/semi-ui-svelte/tooltip/index';
    import { type FileItem, Upload, type UploadOnChangeProps } from '@fibrae/semi-ui-svelte/upload/index';
    import type { AIChatInputProps, AIChatInputUploadButtonSnippetProps, AIChatInputUploadProps } from './interface.js';
    import UploadIcon from './upload-icon.svelte';

    interface UploadButtonProps {
        uploadProps?: AIChatInputUploadProps;
        attachments: Attachment[];
        tipProps?: AIChatInputProps['uploadTipProps'];
        hidden: boolean;
        uploadButton?: Snippet<[AIChatInputUploadButtonSnippetProps]>;
        uploadTip?: Snippet;
        /** Hands the owner a way to add files; the returned function withdraws it. The owner may mount several buttons */
        register: (handle: { insert: (files: File[]) => void }) => () => void;
        onChange: (props: UploadOnChangeProps) => void;
    }

    let { uploadProps, attachments, tipProps, hidden, uploadButton, uploadTip, register, onChange }: UploadButtonProps = $props();

    let upload = $state<ReturnType<typeof Upload>>();

    // AIChatInput owns the attachment list and calls onChange and onRemove itself
    const bindings = $derived(omit(uploadProps ?? {}, ['onChange', 'onRemove', 'defaultFileList']));
    const disabled = $derived(Boolean(uploadProps?.disabled));

    const slotProps = $derived<AIChatInputUploadButtonSnippetProps>({
        defaultNode,
        onOpenFileDialog: () => upload?.openFileDialog(),
        disabled,
        attachments,
    });

    onMount(() => register({ insert: (files) => upload?.insert(files) }));
</script>

{#snippet defaultNode()}
    <UploadIcon {disabled} />
{/snippet}

{#snippet trigger()}
    {#if uploadButton}
        {@render uploadButton(slotProps)}
    {:else}
        <UploadIcon {disabled} />
    {/if}
{/snippet}

{#snippet tip()}
    {@render uploadTip?.()}
{/snippet}

<!-- hidden: paste upload goes through this Upload, so it stays mounted without a trigger -->
<Upload bind:this={upload} {...bindings} action={uploadProps?.action ?? ''} fileList={attachments as FileItem[]} listType="none" {onChange} style={hidden ? 'display: none' : bindings.style}>
    {#if !hidden}
        <!-- the tooltip wraps the focus target, so aria-describedby lands on it and no Tab stop is added -->
        {#if tipProps || uploadTip}
            <Tooltip {...tipProps} content={tip}>
                {@render trigger()}
            </Tooltip>
        {:else}
            {@render trigger()}
        {/if}
    {/if}
</Upload>
