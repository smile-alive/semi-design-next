<script lang="ts">
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import type { TooltipTriggerProps } from '@fibrae/semi-ui-svelte/tooltip/interface';
    import Tooltip from '@fibrae/semi-ui-svelte/tooltip/tooltip.svelte';
    import type { FileItem, UploadOnChangeProps } from '@fibrae/semi-ui-svelte/upload/interface';
    import Upload from '@fibrae/semi-ui-svelte/upload/upload.svelte';
    import type { ChatProps } from './interface.js';
    import UploadButton from './upload-button.svelte';

    // Dropped and pasted files go through this Upload too, so it stays mounted, hidden, when only the click trigger is off.
    interface InputBoxUploadProps {
        attachment: FileItem[];
        clickUpload: boolean;
        uploadProps?: ChatProps['uploadProps'];
        uploadTipProps?: ChatProps['uploadTipProps'];
        uploadButton?: ChatProps['uploadButton'];
        uploadTip?: ChatProps['uploadTip'];
        onChange: (props: UploadOnChangeProps) => void;
    }

    let { attachment, clickUpload, uploadProps, uploadTipProps, uploadButton, uploadTip, onChange }: InputBoxUploadProps = $props();

    let upload = $state<ReturnType<typeof Upload>>();

    const { PREFIX_INPUT_BOX } = cssClasses;

    // class and style are set by trigger state; onChange is called by the foundation, binding it doubles it
    const bindings = $derived({
        ...omit(uploadProps ?? {}, ['class', 'style', 'onChange']),
        action: uploadProps?.action ?? '',
    });

    const tipShown = $derived(clickUpload && Boolean(uploadTip || uploadTipProps));
    const disabled = $derived(Boolean(uploadProps?.disabled));

    export function insert(files: File[]) {
        upload?.insert(files);
    }
</script>

{#snippet tipContent()}
    {@render uploadTip?.()}
{/snippet}

{#snippet triggerButton({ props }: { props: TooltipTriggerProps })}
    {#if uploadButton}
        <!-- tabindex -1 keeps this wrapper out of the Tab order, so Upload's add area stays the one keyboard entry. Known
             limit: when the custom button is itself a control it is the Tab stop instead of the add area. -->
        <span {...props} tabindex="-1">
            {@render uploadButton()}
        </span>
    {:else}
        <UploadButton {disabled} triggerProps={props} />
    {/if}
{/snippet}

<Upload bind:this={upload} {...bindings} class={clickUpload ? [`${PREFIX_INPUT_BOX}-upload`, uploadProps?.class] : undefined} fileList={attachment} {onChange} style={clickUpload ? uploadProps?.style : 'display: none'}>
    {#if clickUpload}
        {#if tipShown}
            <!-- the tip goes on the default button itself, so aria-describedby lands on it and no Tab stop is added -->
            <Tooltip {...uploadTipProps} child={triggerButton} content={uploadTip ? tipContent : undefined} />
        {:else if uploadButton}
            {@render uploadButton()}
        {:else}
            <UploadButton {disabled} />
        {/if}
    {/if}
</Upload>
