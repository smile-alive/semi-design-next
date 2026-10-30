<script lang="ts">
    import InputBoxFoundation, { type InputBoxAdapter } from '@fibrae/semi-ai-foundation/chat/inputbox-foundation';
    import useFoundation from '@fibrae/semi-ui-svelte/_base/use-foundation.svelte.js';
    import type { FileItem } from '@fibrae/semi-ui-svelte/upload/interface';
    import ClearButton from './clear-button.svelte';
    import InputBoxInput from './input-box-input.svelte';
    import InputBoxLayout from './input-box-layout.svelte';
    import InputBoxUpload from './input-box-upload.svelte';
    import type { ChatInputChangeProps, ChatProps, SendHotKey } from './interface.js';
    import SendButton from './send-button.svelte';

    interface InputBoxProps {
        placeholder?: string;
        showClearContext: boolean;
        sendHotKey: SendHotKey;
        /** Overrides the built-in send state when given */
        canSend?: boolean;
        disableSend: boolean;
        clickUpload: boolean;
        dragUpload: boolean;
        pasteUpload: boolean;
        uploadProps?: ChatProps['uploadProps'];
        uploadTipProps?: ChatProps['uploadTipProps'];
        inputBoxCls?: string;
        inputBoxStyle?: string;
        inputArea?: ChatProps['inputArea'];
        uploadButton?: ChatProps['uploadButton'];
        uploadTip?: ChatProps['uploadTip'];
        onSend: (content: string, attachment?: FileItem[]) => void;
        onClear: () => void;
        onInputChange: (props: ChatInputChangeProps) => void;
    }

    interface InputBoxState {
        content: string;
        attachment: FileItem[];
    }

    type Foundation = InputBoxFoundation<InputBoxProps, InputBoxState>;
    type Adapter = InputBoxAdapter<InputBoxProps, InputBoxState>;

    let { placeholder, showClearContext, sendHotKey, canSend, disableSend, clickUpload, dragUpload, pasteUpload, uploadProps, uploadTipProps, inputBoxCls, inputBoxStyle, inputArea, uploadButton, uploadTip, onSend, onClear, onInputChange }: InputBoxProps = $props();

    // shortcut: one placement per node. A custom #inputArea that renders the same node twice (defaultNode and inputNode, or
    // uploadNode) leaves these refs on the last instance only; upgrade by registering each instance as Solid's input does.
    let input = $state<ReturnType<typeof InputBoxInput>>();
    let upload = $state<ReturnType<typeof InputBoxUpload>>();

    const { foundation, states } = useFoundation<Foundation, Adapter, InputBoxProps, InputBoxState>(
        InputBoxFoundation,
        {
            get disableSend() {
                return disableSend;
            },
            get canSend() {
                return canSend;
            },
            get sendHotKey() {
                return sendHotKey;
            },
            get pasteUpload() {
                return pasteUpload;
            },
        } as InputBoxProps,
        () => ({ content: '', attachment: [] }),
        (base) => ({
            notifyInputChange: (value) => onInputChange(value),
            setInputValue: (content) => base.setState({ content }),
            setAttachment: (attachment) => base.setState({ attachment }),
            notifySend: (content, attachment) => onSend(content, attachment),
            notifyUploadChange: (change) => uploadProps?.onChange?.(change),
            manualUpload: (files) => upload?.insert(files),
        })
    );

    const uploadMounted = $derived(clickUpload || dragUpload || pasteUpload);
    const sendDisabled = $derived(InputBoxFoundation.getDisableSend(states().content, states().attachment, disableSend, canSend));

    export function focusInput() {
        input?.focus();
    }

    export function getTextarea() {
        return input?.getTextarea();
    }

    export function insertFiles(files: File[]) {
        upload?.insert(files);
    }
</script>

{#snippet clearNode()}
    <ClearButton onClick={onClear} />
{/snippet}

{#snippet uploadNode()}
    <InputBoxUpload attachment={states().attachment} bind:this={upload} {clickUpload} onChange={foundation.onAttachmentAdd} {uploadButton} {uploadProps} {uploadTip} {uploadTipProps} />
{/snippet}

{#snippet inputNode()}
    <InputBoxInput attachment={states().attachment} bind:this={input} content={states().content} onChange={foundation.onInputAreaChange} onClear={foundation.onAttachmentDelete} onEnterPress={foundation.onEnterPress} onPaste={foundation.onPaste} {placeholder} {sendHotKey} />
{/snippet}

{#snippet sendNode()}
    <SendButton disabled={sendDisabled} onClick={foundation.onSend} />
{/snippet}

{#snippet defaultNode()}
    <InputBoxLayout class={inputBoxCls} clear={showClearContext ? clearNode : undefined} input={inputNode} onInnerClick={focusInput} send={sendNode} style={inputBoxStyle} upload={uploadMounted ? uploadNode : undefined} />
{/snippet}

{#if inputArea}
    {@render inputArea({ defaultNode, clearContextNode: clearNode, uploadNode: uploadMounted ? uploadNode : null, inputNode, sendNode, onSend: (content = '', attachment) => onSend(content, attachment), onClear, onClick: focusInput })}
{:else}
    {@render defaultNode()}
{/if}
