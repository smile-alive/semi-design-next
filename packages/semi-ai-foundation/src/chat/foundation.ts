import { isPlainObject } from 'es-toolkit';
import { handlePrevent } from '@fibrae/semi-foundation/utils/a11y';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { isImageFile } from '../file-suffix';
import MessageListFoundation, { type MessageListAdapter, type MessageListBaseProps, type MessageListState } from '../message-list-foundation';
import { strings, type MessageStatus } from './constants';

const { MESSAGE_STATUS, MODE, ROLE } = strings;

export interface Content {
    type: 'text' | 'image_url' | 'file_url';
    text?: string;
    image_url?: {
        url: string;
        [x: string]: any;
    };
    file_url?: {
        url: string;
        name: string;
        size: string;
        type: string;
        [x: string]: any;
    };
}

export interface Message {
    role?: string;
    name?: string;
    id?: string;
    content?: string | Content[];
    parentId?: string;
    createAt?: number;
    status?: MessageStatus;
    [x: string]: any;
}

export interface EnableUploadProps {
    pasteUpload?: boolean;
    dragUpload?: boolean;
    clickUpload?: boolean;
}

export interface ChatAdapter<P extends ChatBaseProps = ChatBaseProps> extends MessageListAdapter<Message, P, ChatState> {
    notifyMessageReset: (message: Message | null) => void;
    notifyClearContext: () => void;
    notifyMessageSend: (content: string, attachment: any[]) => void;
    notifyInputChange: (props: { inputValue: string; attachment: any[] }) => void;
    notifyStopGenerate: (e: any) => void;
    notifyHintClick: (hint: string) => void;
    manualUpload: (files: File[]) => void;
    getDropAreaElement: () => HTMLDivElement;
}

export type ChatBaseProps = MessageListBaseProps<Message>;

export interface ChatState extends MessageListState {
    uploadAreaVisible: boolean;
}

export default class ChatFoundation<P extends ChatBaseProps = ChatBaseProps> extends MessageListFoundation<Message, ChatAdapter<P>, P, ChatState> {
    /** A drag that started inside the chat moves page content, not files to upload */
    #dragStartedInside = false;

    protected readonly completedStatus = MESSAGE_STATUS.COMPLETE;

    static getInitialState(): ChatState {
        return { backBottomVisible: false, uploadAreaVisible: false };
    }

    /**
     * What the content class names depend on; `bubble` also covers the user's own message in userBubble mode. `user`
     * and `error` hold only with a bubble, unlike AIChatDialogue's: here they are the bubble's colors, which a message
     * without a bubble does not have.
     */
    static getContentFlags(role?: string, status?: string, mode?: string) {
        const isUser = role === ROLE.USER;
        const bubble = mode === MODE.BUBBLE || (mode === MODE.USER_BUBBLE && isUser);
        return {
            bubble,
            user: bubble && isUser,
            error: bubble && status === MESSAGE_STATUS.ERROR,
        };
    }

    /**
     * `disabled` (the Upload is disabled) turns off dragging and pasting but keeps the click entry, so the disabled
     * upload button stays visible
     */
    static getUploadProps(uploadProps?: boolean | EnableUploadProps, disabled = false): Required<EnableUploadProps> {
        let enabled = { dragUpload: true, clickUpload: true, pasteUpload: true };
        if (isPlainObject(uploadProps)) {
            const { dragUpload = true, clickUpload = true, pasteUpload = true } = uploadProps;
            enabled = { dragUpload, clickUpload, pasteUpload };
        } else if (typeof uploadProps === 'boolean') {
            enabled = { dragUpload: uploadProps, clickUpload: uploadProps, pasteUpload: uploadProps };
        }
        return disabled ? { ...enabled, dragUpload: false, pasteUpload: false } : enabled;
    }

    stopGenerate = (e: unknown) => {
        this.adapter.notifyStopGenerate(e);
    };

    clearContext = () => {
        const chats = this.getChats();
        if (chats.at(-1)?.role === ROLE.DIVIDER) {
            return;
        }
        const dividerMessage = {
            role: ROLE.DIVIDER,
            id: createId(),
            createAt: Date.now(),
        };
        this.notifyChats([...chats, dividerMessage]);
        this.adapter.notifyClearContext();
    };

    onMessageSend = (input: string, attachment?: any[]) => {
        let content;
        if (!attachment?.length) {
            content = input;
        } else {
            content = [];
            if (input) {
                content.push({ type: 'text', text: input });
            }
            (attachment ?? []).map((item) => {
                const { fileInstance, name = '', url, size } = item;
                if (isImageFile(name, fileInstance?.type)) {
                    content.push({
                        type: 'image_url',
                        image_url: { url: url },
                    });
                } else {
                    content.push({
                        type: 'file_url',
                        file_url: {
                            url: url,
                            name: name,
                            size: size,
                            type: fileInstance?.type,
                        },
                    });
                }
            });
        }
        if (content) {
            const newMessage = {
                role: ROLE.USER,
                id: createId(),
                createAt: Date.now(),
                content,
            };
            this.notifyChats([...this.getChats(), newMessage]);
        }
        this.resumeFollowing();
        this.adapter.notifyMessageSend(input, attachment);
    };

    onHintClick = (hint: string) => {
        const newMessage = {
            role: ROLE.USER,
            id: createId(),
            createAt: Date.now(),
            content: hint,
        };
        this.resumeFollowing();
        this.notifyChats([...this.getChats(), newMessage]);
        this.adapter.notifyHintClick(hint);
    };

    onInputChange = (props: { inputValue: string; attachment: any[] }) => {
        this.adapter.notifyInputChange(props);
    };

    resetMessage = (message: Message | null) => {
        const chats = this.getChats();
        const lastMessage = chats.at(-1);
        const newLastChat: Message = {
            ...lastMessage,
            status: MESSAGE_STATUS.LOADING,
            content: '',
            like: false,
            dislike: false,
            id: createId(),
            createAt: Date.now(),
        };
        this.notifyChats(chats.slice(0, -1).concat(newLastChat));
        this.adapter.notifyMessageReset(message);
    };

    handleDragOver = (e: { dataTransfer: DataTransfer | null }) => {
        // dragged text or links are not uploads, and the drop area would swallow them
        if (this.#dragStartedInside || !e.dataTransfer?.types.includes('Files')) {
            return;
        }
        this.setState({ uploadAreaVisible: true });
    };

    handleDragStart = () => {
        this.#dragStartedInside = true;
    };

    handleDragEnd = () => {
        this.#dragStartedInside = false;
    };

    handleContainerDragOver = (e: Pick<DragEvent, 'stopPropagation' | 'preventDefault'>) => {
        handlePrevent(e);
    };

    handleContainerDrop = (e: Pick<DragEvent, 'dataTransfer' | 'stopPropagation' | 'preventDefault'>) => {
        this.setState({ uploadAreaVisible: false });
        const files = e.dataTransfer?.files;
        if (files?.length) {
            this.adapter.manualUpload(Array.from(files));
        }
        handlePrevent(e);
    };

    handleContainerDragLeave = (e: Pick<DragEvent, 'stopPropagation' | 'preventDefault' | 'relatedTarget'>) => {
        handlePrevent(e);
        const dropAreaElement = this.adapter.getDropAreaElement();
        const enterTarget = e.relatedTarget;
        if (enterTarget instanceof Node && dropAreaElement.contains(enterTarget)) {
            return;
        }
        // deferred so the parent's mouseOver cannot fire in between and keep the area visible
        setTimeout(() => {
            this.setState({ uploadAreaVisible: false });
        });
    };
}
