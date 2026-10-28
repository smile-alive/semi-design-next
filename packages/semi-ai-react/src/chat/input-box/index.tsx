import React, { useCallback, useImperativeHandle, useState } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
import InputBoxFoundation, { type InputBoxAdapter } from '@fibrae/semi-ai-foundation/chat/inputbox-foundation';
import { IconDeleteStroked, IconChainStroked, IconArrowUp } from '@fibrae/semi-icons-react';
import useFoundation from '@fibrae/semi-ui-react/_base/use-foundation';
import Button from '@fibrae/semi-ui-react/button/index';
import { useLocale, useMergedRef } from '@fibrae/semi-ui-react/hooks';
import type { TextAreaHandle } from '@fibrae/semi-ui-react/input/index';
import TextArea from '@fibrae/semi-ui-react/input/textarea';
import Tooltip from '@fibrae/semi-ui-react/tooltip/index';
import Upload, { type UploadProps } from '@fibrae/semi-ui-react/upload/index';
import Attachment from '../attachment';
import type { InputBoxProps, InputBoxState } from '../interface';

const { PREFIX_INPUT_BOX } = cssClasses;
const { SEND_HOT_KEY } = strings;
const textAutoSize = { minRows: 1, maxRows: 5 };

// Not a ref: the Compiler rejects passing a ref-reading function (the focus handler) into a call during render
class TextAreaHolder {
    #handle: TextAreaHandle | null = null;

    set(handle: TextAreaHandle | null) {
        this.#handle = handle;
    }

    focus() {
        this.#handle?.focus();
    }
}

function InputBox(props: InputBoxProps) {
    const { ref, uploadProps, uploadRef, uploadTipProps, clickUpload, dragUpload, pasteUpload, placeholder, sendHotKey, onClearContext, renderInputArea, onSend, style, className, showClearContext, disableSend, canSend } = props;

    const { locale } = useLocale('Chat');

    const [textArea] = useState(() => new TextAreaHolder());
    let uploadNode: React.ReactNode = null;

    const [foundation, state] = useFoundation<InputBoxFoundation, InputBoxAdapter<InputBoxProps, InputBoxState>, InputBoxProps, InputBoxState>(
        InputBoxFoundation,
        props,
        () => ({ content: '', attachment: [] }),
        (base) => ({
            notifyInputChange: (value) => base.getProps().onInputChange?.(value),
            setInputValue: (content) => base.setState({ content }),
            setAttachment: (attachment) => base.setState({ attachment }),
            notifySend: (content, attachment) => base.getProps().onSend?.(content, attachment),
            notifyUploadChange: (props) => base.getProps().uploadProps?.onChange?.(props),
            manualUpload: (files) => base.getProps().uploadRef?.current?.insert(files),
        })
    );

    const { content, attachment } = state;

    // the Chat's own handle drives dropped and pasted files, so a ref in uploadProps shares the Upload instead of replacing it
    const setUploadRef = useMergedRef(uploadRef, uploadProps?.ref);

    const setTextArea = useCallback((handle: TextAreaHandle | null) => textArea.set(handle), [textArea]);

    const onClick = () => textArea.focus();

    useImperativeHandle(ref, () => ({ focus: () => textArea.focus() }), [textArea]);

    // Dropped and pasted files go through this Upload too, so it stays mounted when only the trigger is turned off
    if (clickUpload || dragUpload || pasteUpload) {
        const { className: uploadCls, onChange, renderFileItem, children, ref: userRef, ...uploadRest } = uploadProps ?? ({} as UploadProps);
        // Upload's add area yields its aria-disabled to a control inside it, so the button carries the state itself
        const trigger = children || <Button className={`${PREFIX_INPUT_BOX}-uploadButton`} aria-label={locale.upload} disabled={uploadRest.disabled} theme="borderless" icon={<IconChainStroked size="extra-large" />} />;
        uploadNode = clickUpload ? (
            <Upload {...uploadRest} ref={setUploadRef} className={clsx(`${PREFIX_INPUT_BOX}-upload`, { [uploadCls]: uploadCls })} fileList={attachment} onChange={foundation.onAttachmentAdd}>
                {/* the tooltip wraps the focus target, so aria-describedby lands on it and no Tab stop is added */}
                {uploadTipProps ? <Tooltip {...uploadTipProps}>{trigger}</Tooltip> : trigger}
            </Upload>
        ) : (
            <Upload {...uploadRest} ref={setUploadRef} style={{ display: 'none' }} fileList={attachment} onChange={foundation.onAttachmentAdd} />
        );
    }

    const inputNode = (
        <div className={`${PREFIX_INPUT_BOX}-inputArea`}>
            <TextArea
                ref={setTextArea}
                className={`${PREFIX_INPUT_BOX}-textarea`}
                aria-label={locale.input}
                placeholder={placeholder}
                value={content}
                autosize={textAutoSize}
                disabledEnterStartNewLine={sendHotKey === SEND_HOT_KEY.ENTER}
                // the composer lays out its own toolbar: global TextArea defaults must not add a clear button, counter or line numbers (maxCount only drives the counter)
                maxCount={0}
                showClear={false}
                showCounter={false}
                showLineNumber={false}
                onChange={foundation.onInputAreaChange}
                onEnterPress={foundation.onEnterPress}
                onPaste={foundation.onPaste}
            />
            <Attachment attachment={attachment} onClear={foundation.onAttachmentDelete} />
        </div>
    );

    const clearNode = <Button className={`${PREFIX_INPUT_BOX}-clearButton`} aria-label={locale.clear} theme="borderless" icon={<IconDeleteStroked />} onClick={onClearContext} />;

    const sendNode = (
        <Button type="primary" className={`${PREFIX_INPUT_BOX}-sendButton`} aria-label={locale.send} disabled={InputBoxFoundation.getDisableSend(content, attachment, disableSend, canSend)} theme="solid" icon={<IconArrowUp className={`${PREFIX_INPUT_BOX}-sendButton-icon`} size="large" />} onClick={foundation.onSend} />
    );

    const nodes = (
        <div className={clsx(PREFIX_INPUT_BOX, { [className]: className })} style={style}>
            <div className={`${PREFIX_INPUT_BOX}-inner`} onClick={onClick}>
                {showClearContext && clearNode}
                <div className={`${PREFIX_INPUT_BOX}-container`}>
                    {uploadNode}
                    {inputNode}
                    {sendNode}
                </div>
            </div>
        </div>
    );

    if (renderInputArea && typeof renderInputArea === 'function') {
        return renderInputArea({
            defaultNode: nodes,
            onClear: onClearContext,
            onSend: onSend,
            detailProps: {
                clearContextNode: clearNode,
                uploadNode: uploadNode,
                inputNode: inputNode,
                sendNode: sendNode,
                onClick,
            },
        });
    }

    return nodes;
}

// memo: Chat re-renders per streamed chunk while the input's props, all foundation methods, refs or primitives, hold
export default React.memo(InputBox);
