import { debounce, isPlainObject } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { handlePrevent } from '@fibrae/semi-foundation/utils/a11y';
import { easeInOutCubic, tween } from '@fibrae/semi-foundation/utils/tween';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { isImageFile } from '../file-suffix';
import { strings, type MessageStatus } from './constants';

const { MESSAGE_STATUS, MODE, ROLE, SCROLL_ANIMATION_TIME, SHOW_SCROLL_GAP } = strings;

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

export interface ChatAdapter<P = Record<string, any>, S = Record<string, any>> extends DefaultAdapter<P, S> {
    getContainerRef: () => HTMLDivElement;
    notifyChatsChange: (chats: Message[]) => void;
    notifyLikeMessage: (message: Message) => void;
    notifyDislikeMessage: (message: Message) => void;
    notifyMessageDelete: (message: Message) => void;
    notifyMessageReset: (message: Message | null) => void;
    notifyClearContext: () => void;
    notifyMessageSend: (content: string, attachment: any[]) => void;
    notifyInputChange: (props: { inputValue: string; attachment: any[] }) => void;
    setBackBottomVisible: (visible: boolean) => void;
    notifyStopGenerate: (e: any) => void;
    notifyHintClick: (hint: string) => void;
    setUploadAreaVisible: (visible: boolean) => void;
    manualUpload: (e: any) => void;
    getDropAreaElement: () => HTMLDivElement;
}

/** The props the foundation reads with getProp */
export interface ChatBaseProps {
    chats?: Message[];
}

export interface ChatBaseState {
    backBottomVisible?: boolean;
}

export default class ChatFoundation<P extends ChatBaseProps = ChatBaseProps, S extends ChatBaseState = ChatBaseState> extends BaseFoundation<ChatAdapter<P, S>, P, S> {
    /** Cancels the running scroll animation */
    #cancelAnimation?: () => void;
    #scrollFrame?: number;
    /** Whether new content scrolls into view: stops when the user scrolls up, resumes on return or on send */
    #following = true;
    #lastScrollTop = 0;
    #position = { top: 0, height: 0 };
    /** A drag that started inside the chat moves page content, not files to upload */
    #dragStartedInside = false;

    #getChats(): Message[] {
        return this.getProp('chats') ?? [];
    }

    /**
     * Follows new content when the user is at the bottom. Otherwise content that grows or shrinks fires no scroll
     * event, so the back-to-bottom button is re-evaluated here. Known limit: growth outside `chats` and `hints` (an
     * image loading) is not seen by this; the ResizeObserver on the container covers a size change of the container.
     * Upgrade to a ResizeObserver on the content node, not only the container, if such growth shows up.
     */
    #followOrRefresh(shouldFollow: boolean) {
        if (shouldFollow && this.#following) {
            this.scrollToBottomImmediately();
        } else {
            this.handleScrollContainerResize();
        }
    }

    #recordPosition() {
        const element = this._adapter.getContainerRef();
        if (element) {
            this.#position = { top: element.scrollTop, height: element.scrollHeight };
        }
    }

    /**
     * Earlier messages went in above: keeps the content below in place. Chrome's scroll anchoring does not apply at
     * scrollTop 0, where a user who scrolled up to load history stands. Set from the recorded position, not added to
     * scrollTop, as anchoring may already have moved it.
     */
    #keepPositionAfterPrepend() {
        const element = this._adapter.getContainerRef();
        if (element) {
            element.scrollTop = this.#position.top + element.scrollHeight - this.#position.height;
        }
    }

    #updateBackBottomVisible = debounce((target: any) => {
        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;
        const scrollTop = target.scrollTop;
        const { backBottomVisible } = this.getStates();
        if (scrollHeight - scrollTop - clientHeight <= SHOW_SCROLL_GAP) {
            if (backBottomVisible) {
                this._adapter.setBackBottomVisible(false);
            }
        } else {
            if (!backBottomVisible) {
                this._adapter.setBackBottomVisible(true);
            }
        }
    }, 100);

    /** What the content class names depend on; `bubble` also covers the user's own message in userBubble mode */
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

    override init() {
        this.scrollToBottomImmediately();
        this.#recordPosition();
    }

    override destroy() {
        this.#cancelAnimation?.();
        cancelAnimationFrame(this.#scrollFrame);
        this.#updateBackBottomVisible.cancel();
    }

    /** Follows a new or still generating last message */
    handleChatsChange(chats: Message[], prevChats: Message[]) {
        const oldChats = prevChats ?? [];
        if (!Array.isArray(chats) || !Array.isArray(oldChats)) {
            return;
        }
        const last = chats.at(-1);
        const oldLast = oldChats.at(-1);
        const added = chats.length > oldChats.length && (oldChats.length === 0 || last.id !== oldLast.id);
        const updated = chats.length === oldChats.length && chats.length > 0 && (last.status !== 'complete' || last.status !== oldLast.status);
        if (chats.length > oldChats.length && !added && chats[chats.length - oldChats.length].id === oldChats[0].id) {
            this.#keepPositionAfterPrepend();
        }
        this.#followOrRefresh(added || updated);
        this.#recordPosition();
    }

    handleHintsChange(hints: string[], prevHints: string[]) {
        this.#followOrRefresh((hints ?? []).length > (prevHints ?? []).length);
    }

    stopGenerate = (e: any) => {
        this._adapter.notifyStopGenerate(e);
    };

    scrollToBottomImmediately() {
        const element = this._adapter.getContainerRef();
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }

    scrollToBottomWithAnimation = () => {
        const duration = SCROLL_ANIMATION_TIME;
        const element = this._adapter.getContainerRef();
        if (!element) {
            return;
        }
        this.#cancelAnimation?.();
        this.#cancelAnimation = tween({
            from: element.scrollTop,
            to: element.scrollHeight,
            duration,
            easing: easeInOutCubic,
            onFrame: (scrollTop) => {
                element.scrollTop = scrollTop;
            },
            // the end is fixed when the animation starts; snapping here catches content that grew meanwhile, and the
            // resulting scroll event resumes following
            onEnd: () => this.scrollToBottomImmediately(),
        });
    };

    containerScroll({ target }: any) {
        const { scrollTop, scrollHeight, clientHeight } = target;
        // only the user lowers scrollTop (growth never does); a drop that still ends at the bottom is shrinking
        if (scrollHeight - scrollTop - clientHeight <= 1) {
            this.#following = true;
        } else if (scrollTop < this.#lastScrollTop) {
            this.#following = false;
        }
        this.#lastScrollTop = scrollTop;
        this.#position = { top: scrollTop, height: scrollHeight };
        cancelAnimationFrame(this.#scrollFrame);
        this.#scrollFrame = requestAnimationFrame(() => this.#updateBackBottomVisible(target));
    }

    handleScrollContainerResize = () => {
        this.#updateBackBottomVisible(this._adapter.getContainerRef());
    };

    clearContext = (_e: any) => {
        const chats = this.#getChats();
        if (chats.at(-1)?.role === ROLE.DIVIDER) {
            return;
        }
        const dividerMessage = {
            role: ROLE.DIVIDER,
            id: createId(),
            createAt: Date.now(),
        };
        const newChats = [...chats, dividerMessage];
        this._adapter.notifyChatsChange(newChats);
        this._adapter.notifyClearContext();
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
            this._adapter.notifyChatsChange([...this.#getChats(), newMessage]);
        }
        this.#following = true;
        this._adapter.notifyMessageSend(input, attachment);
    };

    onHintClick = (hint: string) => {
        const chats = this.#getChats();
        const newMessage = {
            role: ROLE.USER,
            id: createId(),
            createAt: Date.now(),
            content: hint,
        };
        const newChats = [...chats, newMessage];
        this.#following = true;
        this._adapter.notifyChatsChange(newChats);
        this._adapter.notifyHintClick(hint);
    };

    onInputChange = (props: { inputValue: string; attachment: any[] }) => {
        this._adapter.notifyInputChange(props);
    };

    deleteMessage = (message: Message) => {
        const chats = this.#getChats();
        this._adapter.notifyMessageDelete(message);
        const newChats = chats.filter((item) => item.id !== message.id);
        this._adapter.notifyChatsChange(newChats);
    };

    likeMessage = (message: Message) => {
        const chats = this.#getChats();
        const index = chats.findIndex((item) => item.id === message.id);
        if (index === -1) {
            return;
        }
        this._adapter.notifyLikeMessage(message);
        const newChat = {
            ...chats[index],
            like: !chats[index].like,
            dislike: false,
        };
        const newChats = [...chats];
        newChats.splice(index, 1, newChat);
        this._adapter.notifyChatsChange(newChats);
    };

    dislikeMessage = (message: Message) => {
        const chats = this.#getChats();
        const index = chats.findIndex((item) => item.id === message.id);
        if (index === -1) {
            return;
        }
        this._adapter.notifyDislikeMessage(message);
        const newChat = {
            ...chats[index],
            like: false,
            dislike: !chats[index].dislike,
        };
        const newChats = [...chats];
        newChats.splice(index, 1, newChat);
        this._adapter.notifyChatsChange(newChats);
    };

    resetMessage = (message: Message | null) => {
        const chats = this.#getChats();
        const lastMessage = chats.at(-1);
        const newLastChat: Message = {
            ...lastMessage,
            status: 'loading',
            content: '',
            like: false,
            dislike: false,
            id: createId(),
            createAt: Date.now(),
        };
        const newChats = chats.slice(0, -1).concat(newLastChat);
        this._adapter.notifyChatsChange(newChats);
        this._adapter.notifyMessageReset(message);
    };

    handleDragOver = (e: { dataTransfer: DataTransfer | null }) => {
        // dragged text or links are not uploads, and the drop area would swallow them
        if (this.#dragStartedInside || !e.dataTransfer?.types.includes('Files')) {
            return;
        }
        this._adapter.setUploadAreaVisible(true);
    };

    handleDragStart = () => {
        this.#dragStartedInside = true;
    };

    handleDragEnd = () => {
        this.#dragStartedInside = false;
    };

    handleContainerDragOver = (e: any) => {
        handlePrevent(e);
    };

    handleContainerDrop = (e) => {
        this._adapter.setUploadAreaVisible(false);
        const files = e?.dataTransfer?.files;
        if (files?.length) {
            this._adapter.manualUpload(files);
        }
        handlePrevent(e);
    };

    handleContainerDragLeave = (e: any) => {
        handlePrevent(e);
        const dropAreaElement = this._adapter.getDropAreaElement();
        const enterTarget = e.relatedTarget;
        if (dropAreaElement.contains(enterTarget)) {
            return;
        }
        // deferred so the parent's mouseOver cannot fire in between and keep the area visible
        setTimeout(() => {
            this._adapter.setUploadAreaVisible(false);
        });
    };
}
