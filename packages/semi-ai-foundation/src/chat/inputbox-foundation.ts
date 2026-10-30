import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { handlePrevent } from '@fibrae/semi-foundation/utils/a11y';
import { strings, type SendHotKey } from './constants';

const { SEND_HOT_KEY } = strings;

export interface InputBoxAdapter<P = Record<string, any>, S = Record<string, any>> extends DefaultAdapter<P, S> {
    notifyInputChange: (props: { inputValue: string; attachment: any[] }) => void;
    setInputValue: (value: string) => void;
    setAttachment: (attachment: any[]) => void;
    notifySend: (content: string, attachment: any[]) => void;
    notifyUploadChange: (props: any) => void;
    /** Adds pasted files to the attachments through the same Upload as dropped files */
    manualUpload: (files: File[]) => void;
}

/** The props the foundation reads with getProps */
export interface InputBoxBaseProps {
    disableSend?: boolean;
    canSend?: boolean;
    sendHotKey?: SendHotKey;
    pasteUpload?: boolean;
}

export interface InputBoxBaseState {
    content: string;
    attachment: any[];
}

export default class InputBoxFoundation<P extends InputBoxBaseProps = InputBoxBaseProps, S extends InputBoxBaseState = InputBoxBaseState> extends BaseFoundation<InputBoxAdapter<P, S>, P, S> {
    /** Static so render can call it with this render's props */
    static getDisableSend(content: string, attachment: any[], disableSend?: boolean, canSend?: boolean) {
        if (typeof canSend === 'boolean') {
            return !canSend;
        }
        return Boolean(disableSend) || (content.length === 0 && attachment.length === 0) || attachment.some((item) => item.status !== strings.FILE_STATUS.SUCCESS);
    }

    onInputAreaChange = (value: string) => {
        const attachment = this.getState('attachment');
        this._adapter.setInputValue(value);
        this._adapter.notifyInputChange({ inputValue: value, attachment });
    };

    onAttachmentAdd = (props: any) => {
        const { fileList } = props;
        this._adapter.notifyUploadChange(props);
        const { content } = this.getStates();
        let newFileList = [...fileList];
        this._adapter.setAttachment(newFileList);
        this._adapter.notifyInputChange({
            inputValue: content,
            attachment: newFileList,
        });
    };

    onAttachmentDelete = (props: any) => {
        const { content, attachment } = this.getStates();
        const newAttachMent = attachment.filter((item) => item.uid !== props.uid);
        this._adapter.setAttachment(newAttachMent);
        this._adapter.notifyUploadChange({ fileList: newAttachMent, currentFile: props });
        this._adapter.notifyInputChange({
            inputValue: content,
            attachment: newAttachMent,
        });
    };

    onSend = (_e: unknown) => {
        const { content, attachment } = this.getStates();
        const { disableSend, canSend } = this.getProps();
        if (InputBoxFoundation.getDisableSend(content, attachment, disableSend, canSend)) {
            return;
        }
        this._adapter.setInputValue('');
        this._adapter.setAttachment([]);
        this._adapter.notifySend(content, attachment);
    };

    onEnterPress = (e: Pick<KeyboardEvent, 'shiftKey' | 'stopPropagation' | 'preventDefault'>) => {
        const { sendHotKey } = this.getProps();
        if (sendHotKey === SEND_HOT_KEY.SHIFT_PLUS_ENTER && e.shiftKey === false) {
            return;
        } else if (sendHotKey === SEND_HOT_KEY.ENTER && e.shiftKey === true) {
            return;
        }
        handlePrevent(e);
        this.onSend(e);
    };

    onPaste = (e: Pick<ClipboardEvent, 'clipboardData' | 'stopPropagation' | 'preventDefault'>) => {
        const items = e.clipboardData?.items;
        const { pasteUpload } = this.getProps();
        let files = [];
        if (pasteUpload && items) {
            for (const it of items) {
                const file = it.getAsFile();
                if (file) {
                    files.push(file);
                }
            }
            if (files.length) {
                this._adapter.manualUpload(files);
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };
}
