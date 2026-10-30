import { debounce } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { easeInOutCubic, tween } from '@fibrae/semi-foundation/utils/tween';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import type { Reference } from '../ai-chat-input/interface';
import { strings } from './constants';
import type { ResponseError } from './data-adapter/interface';

export type { Reference };

export interface DialogueAdapter<P extends DialogueBaseProps = DialogueBaseProps, S extends DialogueBaseState = DialogueBaseState> extends DefaultAdapter<P, S> {
    getContainerRef: () => HTMLDivElement;
    updateSelected: (selectedIds: Set<string>) => void;
    notifySelect: (selectedIds: string[]) => void;
    notifyChatsChange: (chats: Message[]) => void;
    notifyLikeMessage: (message: Message) => void;
    notifyDislikeMessage: (message: Message) => void;
    notifyEditMessage: (message: Message) => void;
    notifyMessageDelete: (message: Message) => void;
    notifyMessageReset: (message: Message) => void;
    notifyHintClick: (hint: string) => void;
    setBackBottomVisible: (visible: boolean) => void;
}

/** The props the foundation reads with getProps */
export interface DialogueBaseProps {
    chats?: Message[];
}

export interface DialogueBaseState {
    backBottomVisible?: boolean;
    selectedIds?: Set<string>;
}

export default class DialogueFoundation<P extends DialogueBaseProps = DialogueBaseProps, S extends DialogueBaseState = DialogueBaseState> extends BaseFoundation<DialogueAdapter<P, S>, P, S> {
    /** Cancels the running scroll animation */
    #cancelAnimation?: () => void;
    #scrollFrame?: number;
    /** Whether new content scrolls into view: stops when the user scrolls up, resumes on return or on a new message */
    #following = true;
    #lastScrollTop = 0;
    /**
     * Scroll position and content height after the last commit or scroll. Known limit: content that grows in between
     * (an image loading) counts as inserted; record on resize too if that shows up.
     */
    #position = { top: 0, height: 0 };

    #syncBackBottomVisible({ scrollHeight, clientHeight, scrollTop }: HTMLElement) {
        const { backBottomVisible } = this.getStates();
        if (scrollHeight - scrollTop - clientHeight <= strings.SHOW_SCROLL_GAP) {
            if (backBottomVisible) {
                this.adapter.setBackBottomVisible(false);
            }
        } else if (!backBottomVisible) {
            this.adapter.setBackBottomVisible(true);
        }
    }

    #updateBackBottomVisible = debounce((element: HTMLElement) => this.#syncBackBottomVisible(element), 100);

    #getChats() {
        return this.getProps().chats ?? [];
    }

    #animateScrollTop(getTarget: (element: HTMLDivElement) => number, onEnd?: () => void) {
        const element = this.adapter.getContainerRef();
        if (!element) {
            return;
        }
        this.#cancelAnimation?.();
        this.#cancelAnimation = tween({
            from: element.scrollTop,
            to: getTarget(element),
            duration: strings.SCROLL_ANIMATION_TIME,
            easing: easeInOutCubic,
            onFrame: (scrollTop) => {
                element.scrollTop = scrollTop;
            },
            onEnd,
        });
    }

    #recordPosition() {
        const element = this.adapter.getContainerRef();
        if (element) {
            this.#position = { top: element.scrollTop, height: element.scrollHeight };
        }
    }

    /**
     * Earlier messages went in above: keeps the content below in place. Set from the recorded position, not added to
     * scrollTop, as Chrome's scroll anchoring may already have moved it.
     */
    #keepPositionAfterPrepend() {
        const element = this.adapter.getContainerRef();
        if (element) {
            element.scrollTop = this.#position.top + element.scrollHeight - this.#position.height;
        }
    }

    /** What decides the modifier classes of a message's content: whether it sits in a bubble, is the user's, or failed inside one */
    static getContentFlags(role?: string, status?: string, mode?: string) {
        const user = role === strings.ROLE.USER;
        const bubble = mode === strings.MODE.BUBBLE || (mode === strings.MODE.USER_BUBBLE && user);
        return { bubble, user, error: status === strings.STATUS.FAILED && bubble };
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

    /**
     * Runs after a commit in which `chats` or `hints` changed (arrays normalized by the caller)
     */
    handleListUpdate = (prev: DialogueList, { chats, hints }: DialogueList) => {
        const prevChats = prev.chats;
        let shouldScroll = false;
        if (chats !== prevChats) {
            this.adapter.notifyChatsChange(chats);
            const newLastChat = chats.at(-1);
            const oldLastChat = prevChats.at(-1);
            if (chats.length > prevChats.length) {
                if (prevChats.length === 0 || newLastChat.id !== oldLastChat.id) {
                    this.#following = true;
                    shouldScroll = true;
                } else if (chats[chats.length - prevChats.length].id === prevChats[0].id) {
                    this.#keepPositionAfterPrepend();
                }
            } else if (chats.length === prevChats.length && chats.length && (newLastChat.status !== 'completed' || newLastChat.status !== oldLastChat.status)) {
                shouldScroll = true;
            }
        }
        if (hints !== prev.hints && hints.length > prev.hints.length) {
            shouldScroll = true;
        }
        if (this.#following && shouldScroll) {
            this.scrollToBottomImmediately();
        } else {
            // content that grows or shrinks without scrolling fires no scroll event; known limit: growth outside
            // `chats` (an image loading) is not seen, upgrade to a ResizeObserver if that shows up
            const element = this.adapter.getContainerRef();
            if (element) {
                this.#updateBackBottomVisible(element);
            }
        }
        this.#recordPosition();
    };

    handleSelectAll = () => {
        const selectedSet = new Set<string>(this.#getChats().map((chat) => chat.id));
        this.adapter.updateSelected(selectedSet);
        this.adapter.notifySelect(Array.from(selectedSet));
    };

    handleDeselectAll = () => {
        this.adapter.updateSelected(new Set());
        this.adapter.notifySelect([]);
    };

    handleSelectOrRemove = (isChecked: boolean, id: string) => {
        // messages deleted or replaced since the last change must not be reported as selected
        const existingIds = new Set(this.#getChats().map((chat) => chat.id));
        const newSelectedSet = new Set<string>([...this.getStates().selectedIds].filter((selectedId) => existingIds.has(selectedId)));
        if (isChecked) {
            newSelectedSet.add(id);
        } else {
            newSelectedSet.delete(id);
        }
        this.adapter.updateSelected(newSelectedSet);
        this.adapter.notifySelect(Array.from(newSelectedSet));
    };

    likeMessage = (message: Message) => {
        const chats = this.#getChats();
        const index = chats.findIndex((item) => item.id === message.id);
        if (index === -1) {
            return;
        }
        this.adapter.notifyLikeMessage(message);
        const newChat = {
            ...chats[index],
            like: !chats[index].like,
            dislike: false,
        };
        const newChats = [...chats];
        newChats.splice(index, 1, newChat);
        this.adapter.notifyChatsChange(newChats);
    };

    dislikeMessage = (message: Message) => {
        const chats = this.#getChats();
        const index = chats.findIndex((item) => item.id === message.id);
        if (index === -1) {
            return;
        }
        this.adapter.notifyDislikeMessage(message);
        const newChat = {
            ...chats[index],
            like: false,
            dislike: !chats[index].dislike,
        };
        const newChats = [...chats];
        newChats.splice(index, 1, newChat);
        this.adapter.notifyChatsChange(newChats);
    };

    resetMessage = (message: Message) => {
        const chats = this.#getChats();
        const lastMessage = chats.at(-1);
        const newLastChat = {
            ...lastMessage,
            status: 'in_progress',
            content: '',
            like: false,
            dislike: false,
            output_text: undefined,
            error: undefined,
            references: undefined,
            id: createId(),
            createdAt: Date.now(),
        };
        const newChats = chats.slice(0, -1).concat(newLastChat);
        this.adapter.notifyChatsChange(newChats);
        this.adapter.notifyMessageReset(message);
    };

    editMessage = (message: Message) => {
        const chats = this.#getChats();
        this.adapter.notifyEditMessage(message);
        const newChats = chats.map((item) => {
            if (item.id === message.id) {
                return { ...item, editing: !item.editing };
            }
            return item.editing ? { ...item, editing: false } : item;
        });
        this.adapter.notifyChatsChange(newChats);
    };

    deleteMessage = (message: Message) => {
        const chats = this.#getChats();
        this.adapter.notifyMessageDelete(message);
        const newChats = chats.filter((item) => item.id !== message.id);
        this.adapter.notifyChatsChange(newChats);
    };

    onHintClick = (hint: string) => {
        const chats = this.#getChats();
        const newMessage = {
            role: strings.ROLE.USER,
            id: createId(),
            createdAt: Date.now(),
            content: hint,
        };
        const newChats = [...chats, newMessage];
        this.adapter.notifyChatsChange(newChats);
        this.adapter.notifyHintClick(hint);
    };

    scrollToBottomImmediately = () => {
        const element = this.adapter.getContainerRef();
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    };

    scrollToBottomWithAnimation = () => {
        // the end is fixed when the animation starts; snapping at the end catches content that grew meanwhile, and the
        // resulting scroll event resumes following
        this.#animateScrollTop(
            (element) => element.scrollHeight,
            () => this.scrollToBottomImmediately()
        );
    };

    scrollToTopImmediately = () => {
        const element = this.adapter.getContainerRef();
        if (element) {
            element.scrollTop = 0;
        }
    };

    scrollToTopWithAnimation = () => {
        this.#animateScrollTop(() => 0);
    };

    containerScroll = (e: { target: EventTarget | null }) => {
        // the scroll listener sits on the list element and scroll does not bubble, so the target is always that element
        const target = e.target as HTMLElement;
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
    };
}

export interface DialogueList {
    chats: Message[];
    hints: string[];
}

export interface Message {
    id: string;
    content?: string | ContentItem[];
    output_text?: string;
    role: string;
    name?: string;
    createdAt?: number;
    updatedAt?: number;
    model?: string;
    status?: string;
    editing?: boolean;
    like?: boolean;
    dislike?: boolean;
    references?: Reference[];
    error?: ResponseError | null;
    [x: string]: any;
}

export type ContentItem = InputContentItem | OutputContentItem;

export type InputContentItem = InputMessage | ItemReference;
export type OutputContentItem = OutputMessage | ToolCallContentItem | MCPContentItem | Reasoning;

export type ToolCallContentItem = FileSearchToolCall | WebSearchToolCall | FunctionToolCall | CustomToolCall | ImageGenerationCall | CustomObject;
export type MCPContentItem = MCPToolCall;

export interface CommonContentItem {
    id?: string;
    type?: string;
    status?: string;
    role?: string;
}

export interface InputMessage extends CommonContentItem {
    content?: string | (InputText | InputImage | InputFile | InputAudio)[];
}

export interface ItemReference extends CommonContentItem {
    file_id?: string;
}

export interface CustomObject {
    [key: string]: any;
}

export interface OutputMessage extends CommonContentItem {
    content?: (OutputText | Refusal)[];
}

export interface OutputText {
    text?: string;
    type?: string;
    annotations?: Annotation[];
}

export interface Refusal extends CommonContentItem {
    refusal?: string;
    type?: string;
}

export interface URLCitation {
    end_index?: number;
    start_index?: number;
    title?: string;
    type?: string;
    url?: string;
}

export type Annotation = URLCitation | CustomObject;

export interface Reasoning extends CommonContentItem {
    summary?: {
        text?: string;
        type?: string;
    }[];
    content?: {
        text?: string;
        type?: string;
    }[];
}

export interface FileSearchToolCallResult {
    attributes?: Map<string, string>;
    score?: number;
    file_id?: string;
    filename?: string;
    text?: string;
}

export interface FileSearchToolCall extends CommonContentItem {
    queries?: string[];
    results?: FileSearchToolCallResult[];
}

export interface WebSearchToolCall extends CommonContentItem {
    action?: SearchAction | OpenPageAction | FindAction;
}
export interface SearchAction {
    type?: string;
    query?: string;
    sources?: { type: string; url: string }[];
}
export interface OpenPageAction {
    type?: string;
    url?: string;
}
export interface FindAction {
    action?: string;
    type?: string;
    query?: string;
}

export interface FunctionToolCall extends CommonContentItem {
    call_id?: string;
    name?: string;
    arguments?: string;
}

export interface CustomToolCall extends CommonContentItem {
    call_id?: string;
    name?: string;
    input?: string;
}

export interface ImageGenerationCall extends CommonContentItem {
    result?: string;
}

export interface MCPToolCall extends CommonContentItem {
    arguments?: string;
    server_label?: string;
    name?: string;
    result?: string;
    output?: string;
}

export interface FileUploadToolCall extends CommonContentItem {
    result?: string;
}

export interface InputText extends CommonContentItem {
    text?: string;
}

export interface InputImage extends CommonContentItem {
    detail?: string;
    file_id?: string;
    image_url?: string;
}

export interface InputFile extends CommonContentItem {
    file_id?: string;
    file_data?: string;
    file_url?: string;
    filename?: string;
    size?: string;
    file_type?: string;
    fileInstance?: any;
}

export interface InputAudio extends CommonContentItem {
    input_audio?: {
        data: string;
        format: string;
    };
}

// Not part of the OpenAI schema
export interface Action {
    status?: string;
    summary?: string;
    description?: string;
    icon?: any;
}

export interface Step {
    type?: string;
    status?: string;
    summary?: string;
    actions?: Action[];
}
