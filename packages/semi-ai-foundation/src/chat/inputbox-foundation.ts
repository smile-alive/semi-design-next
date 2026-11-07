import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { strings as uploadStrings } from '@fibrae/semi-foundation/components/upload/constants';
import { removeUnlessPrevented } from '@fibrae/semi-foundation/components/upload/utils';
import { handlePrevent } from '@fibrae/semi-foundation/utils/a11y';
import { strings, type SendHotKey } from './constants';

const { SEND_HOT_KEY } = strings;

export interface InputBoxAdapter<P extends InputBoxBaseProps = InputBoxBaseProps> extends DefaultAdapter<P, InputBoxState> {
    notifyInputChange: (props: { inputValue: string; attachment: any[] }) => void;
    notifySend: (content: string, attachment: any[]) => void;
    notifyUploadChange: (props: any) => void;
    /** Resolves to false to keep the attachment, like Upload's beforeRemove */
    notifyBeforeRemove: (file: any, attachment: any[]) => boolean | void | Promise<boolean | void>;
    notifyRemove: (fileInstance: File | undefined, attachment: any[], file: any) => void;
    /** Adds pasted files to the attachments through the same Upload as dropped files */
    manualUpload: (files: File[]) => void;
}

export interface InputBoxBaseProps {
    disableSend?: boolean;
    canSend?: boolean;
    sendHotKey?: SendHotKey;
    pasteUpload?: boolean;
}

export interface InputBoxState {
    content: string;
    attachment: any[];
}

export default class InputBoxFoundation<P extends InputBoxBaseProps = InputBoxBaseProps> extends BaseFoundation<InputBoxAdapter<P>, P, InputBoxState> {
    static getInitialState(): InputBoxState {
        return { content: '', attachment: [] };
    }

    /** Static so render can call it with this render's props */
    static getDisableSend(content: string, attachment: any[], disableSend?: boolean, canSend?: boolean) {
        if (typeof canSend === 'boolean') {
            return !canSend;
        }
        return Boolean(disableSend) || (content.length === 0 && attachment.length === 0) || attachment.some((item) => item.status !== uploadStrings.FILE_STATUS_SUCCESS);
    }

    onInputAreaChange = (value: string) => {
        const attachment = this.getState('attachment');
        this.setState({ content: value });
        this.adapter.notifyInputChange({ inputValue: value, attachment });
    };

    onAttachmentAdd = (props: any) => {
        const { fileList } = props;
        this.adapter.notifyUploadChange(props);
        const { content } = this.getStates();
        let newFileList = [...fileList];
        this.setState({ attachment: newFileList });
        this.adapter.notifyInputChange({
            inputValue: content,
            attachment: newFileList,
        });
    };

    onAttachmentDelete = (props: any) => {
        removeUnlessPrevented(this.adapter.notifyBeforeRemove(props, this.getState('attachment')), () => {
            // the list may have changed while beforeRemove was pending
            const { content, attachment } = this.getStates();
            const newAttachMent = attachment.filter((item) => item.uid !== props.uid);
            if (newAttachMent.length === attachment.length) {
                return;
            }
            this.setState({ attachment: newAttachMent });
            this.adapter.notifyRemove(props.fileInstance, newAttachMent, props);
            this.adapter.notifyUploadChange({ fileList: newAttachMent, currentFile: props });
            this.adapter.notifyInputChange({
                inputValue: content,
                attachment: newAttachMent,
            });
        });
    };

    onSend = (_e: unknown) => {
        const { content, attachment } = this.getStates();
        const { disableSend, canSend } = this.getProps();
        if (InputBoxFoundation.getDisableSend(content, attachment, disableSend, canSend)) {
            return;
        }
        this.setState({ content: '', attachment: [] });
        this.adapter.notifySend(content, attachment);
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
                this.adapter.manualUpload(files);
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };
}
