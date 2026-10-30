import { type JSX, type Ref, Show, createMemo, onCleanup, untrack } from 'solid-js';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses, strings, type SendHotKey } from '@fibrae/semi-ai-foundation/chat/constants';
import InputBoxFoundation, { type InputBoxAdapter } from '@fibrae/semi-ai-foundation/chat/inputbox-foundation';
import { IconArrowUp, IconChainStroked, IconDeleteStroked } from '@fibrae/semi-icons-solid';
import mergeRefs from '@fibrae/semi-ui-solid/_base/merge-refs';
import useFoundation from '@fibrae/semi-ui-solid/_base/use-foundation';
import Button from '@fibrae/semi-ui-solid/button/index';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import TextArea from '@fibrae/semi-ui-solid/input/textarea';
import Tooltip, { type GetTriggerProps, type TooltipProps } from '@fibrae/semi-ui-solid/tooltip/index';
import Upload, { type FileItem, type UploadElement } from '@fibrae/semi-ui-solid/upload/index';
import Attachment from './attachment';
import type { ChatProps, RenderInputAreaProps } from './interface';

const { PREFIX_INPUT_BOX } = cssClasses;
const { SEND_HOT_KEY } = strings;
const textAutoSize = { minRows: 1, maxRows: 5 };
const hiddenStyle = { display: 'none' } as const;

export interface InputBoxHandle {
    focus: () => void;
    /** Adds dropped files to the attachments through the Upload the input renders */
    insert: (files: File[]) => void;
}

interface InputBoxProps {
    ref?: Ref<InputBoxHandle>;
    canSend?: boolean;
    showClearContext?: boolean;
    sendHotKey?: SendHotKey;
    placeholder?: string;
    class?: string;
    style?: JSX.CSSProperties | string;
    disableSend?: boolean;
    uploadTipProps?: TooltipProps;
    uploadProps?: ChatProps['uploadProps'];
    renderInputArea?: (props: RenderInputAreaProps) => JSX.Element;
    onSend?: (content: string, attachment?: FileItem[]) => void;
    onClearContext?: (e: MouseEvent) => void;
    onInputChange?: (props: { inputValue: string; attachment: FileItem[] }) => void;
    clickUpload?: boolean;
    dragUpload?: boolean;
    pasteUpload?: boolean;
}

interface InputBoxState {
    content: string;
    attachment: FileItem[];
}

type Foundation = InputBoxFoundation<InputBoxProps, InputBoxState>;
type Adapter = InputBoxAdapter<InputBoxProps, InputBoxState>;

/**
 * The elements a node getter created, latest last. A custom input area may render the default node and a detail node
 * together, or drop one later, so the latest one still mounted is the target.
 */
function liveElements<T>() {
    const items: T[] = [];
    return {
        add: (item: T) => {
            items.push(item);
            onCleanup(() => items.splice(items.indexOf(item), 1));
        },
        latest: () => items.at(-1),
    };
}

export default function InputBox(props: InputBoxProps) {
    const locale = useLocale('Chat');

    const textareas = liveElements<HTMLTextAreaElement>();
    const uploads = liveElements<UploadElement>();

    const { foundation, state } = useFoundation<Foundation, Adapter, InputBoxProps, InputBoxState>(
        InputBoxFoundation,
        props,
        () => ({ content: '', attachment: [] }),
        (base) => ({
            notifyInputChange: (value) => props.onInputChange?.(value),
            setInputValue: (content) => base.setState({ content }),
            setAttachment: (attachment) => base.setState({ attachment }),
            notifySend: (content, attachment) => props.onSend?.(content, attachment),
            notifyUploadChange: (changed) => props.uploadProps?.onChange?.(changed),
            manualUpload: (files) => uploads.latest()?.insert(files),
        })
    );

    // a consumer spreading a signal object notifies every prop on any change, which must not redraw these nodes
    const uploadTipProps = createMemo(() => props.uploadTipProps);
    const uploadChildren = createMemo(() => props.uploadProps?.children);
    const anyUpload = createMemo(() => Boolean(props.clickUpload || props.dragUpload || props.pasteUpload));

    // delivered once while created, like an element ref
    const ref = untrack(() => props.ref);

    // Chat's own handle drives dropped and pasted files, so a ref in uploadProps shares the Upload instead of replacing it
    const uploadAttrs = () => ({ ...omit(props.uploadProps ?? ({} as NonNullable<ChatProps['uploadProps']>), ['class', 'onChange', 'renderFileItem', 'children', 'ref']), action: props.uploadProps?.action ?? '' });

    const focus = () => textareas.latest()?.focus();

    // Upload's add area yields its aria-disabled to a control inside it, so the button carries the state itself
    const uploadButton = (own: Record<string, unknown> = {}) => <Button {...own} class={`${PREFIX_INPUT_BOX}-uploadButton`} aria-label={locale().locale.upload} disabled={props.uploadProps?.disabled} theme="borderless" icon={<IconChainStroked size="extra-large" />} />;

    // redrawn when the tip or the custom trigger changes
    const uploadTrigger = () => {
        const tipProps = uploadTipProps();
        const custom = uploadChildren();
        return untrack(() => {
            if (custom) {
                // a custom node may not be the focus target, so the tip wraps it in its span
                return tipProps ? <Tooltip {...tipProps}>{custom}</Tooltip> : custom;
            }
            // the tip goes on the button, so aria-describedby lands on it and no Tab stop is added
            return tipProps ? <Tooltip {...tipProps}>{(getTriggerProps: GetTriggerProps) => uploadButton(getTriggerProps())}</Tooltip> : uploadButton();
        });
    };

    // Dropped and pasted files go through this Upload too, so it stays mounted when only the trigger is turned off
    const uploadNode = () => (
        <Show when={anyUpload()}>
            <Upload
                {...uploadAttrs()}
                ref={mergeRefs<UploadElement>(
                    uploads.add,
                    untrack(() => props.uploadProps?.ref)
                )}
                class={props.clickUpload ? clsx(`${PREFIX_INPUT_BOX}-upload`, props.uploadProps?.class) : undefined}
                style={props.clickUpload ? props.uploadProps?.style : hiddenStyle}
                fileList={state().attachment}
                onChange={foundation.onAttachmentAdd}
            >
                <Show when={props.clickUpload}>{uploadTrigger()}</Show>
            </Upload>
        </Show>
    );

    const inputNode = () => (
        <div class={`${PREFIX_INPUT_BOX}-inputArea`}>
            <TextArea
                textareaRef={textareas.add}
                class={`${PREFIX_INPUT_BOX}-textarea`}
                aria-label={locale().locale.input}
                placeholder={props.placeholder}
                value={state().content}
                autosize={textAutoSize}
                disabledEnterStartNewLine={props.sendHotKey === SEND_HOT_KEY.ENTER}
                // the composer lays out its own toolbar: global TextArea defaults must not add a clear button, counter or line numbers (maxCount only drives the counter)
                maxCount={0}
                showClear={false}
                showCounter={false}
                showLineNumber={false}
                onChange={foundation.onInputAreaChange}
                onEnterPress={foundation.onEnterPress}
                onPaste={foundation.onPaste}
            />
            <Attachment attachment={state().attachment} onClear={foundation.onAttachmentDelete} />
        </div>
    );

    const clearNode = () => <Button class={`${PREFIX_INPUT_BOX}-clearButton`} aria-label={locale().locale.clear} theme="borderless" icon={<IconDeleteStroked />} onClick={(e) => props.onClearContext?.(e)} />;

    const sendNode = () => (
        <Button
            type="primary"
            class={`${PREFIX_INPUT_BOX}-sendButton`}
            aria-label={locale().locale.send}
            disabled={InputBoxFoundation.getDisableSend(state().content, state().attachment, props.disableSend, props.canSend)}
            theme="solid"
            icon={<IconArrowUp class={`${PREFIX_INPUT_BOX}-sendButton-icon`} size="large" />}
            onClick={foundation.onSend}
        />
    );

    const nodes = () => (
        <div class={clsx(PREFIX_INPUT_BOX, props.class)} style={props.style}>
            <div class={`${PREFIX_INPUT_BOX}-inner`} onClick={focus}>
                <Show when={props.showClearContext}>{clearNode()}</Show>
                <div class={`${PREFIX_INPUT_BOX}-container`}>
                    {uploadNode()}
                    {inputNode()}
                    {sendNode()}
                </div>
            </div>
        </div>
    );

    const renderProps: RenderInputAreaProps = {
        defaultNode: nodes,
        onSend: (content, attachment) => props.onSend?.(content ?? '', attachment),
        onClear: (e) => props.onClearContext?.(e as MouseEvent),
        detailProps: {
            clearContextNode: clearNode,
            uploadNode,
            inputNode,
            sendNode,
            onClick: focus,
        },
    };

    if (typeof ref === 'function') {
        ref({ focus, insert: (files) => uploads.latest()?.insert(files) });
    }

    return (
        <Show when={props.renderInputArea} keyed fallback={nodes()}>
            {(render) => render(renderProps)}
        </Show>
    );
}
