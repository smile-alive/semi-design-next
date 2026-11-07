import { isEqual } from 'es-toolkit';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import MessageListFoundation, { type MessageListAdapter, type MessageListBaseProps, type MessageListState } from '../../base/message-list-foundation';
import type { Reference } from '../ai-chat-input/interface';
import { strings } from './constants';
import type { ResponseError } from './data-adapter/interface';

export type { Reference };

export interface DialogueAdapter<P extends DialogueBaseProps = DialogueBaseProps> extends MessageListAdapter<Message, P, DialogueState> {
    notifySelect: (selectedIds: string[]) => void;
    notifyEditMessage: (message: Message) => void;
    notifyMessageReset: (message: Message) => void;
    notifyHintClick: (hint: string) => void;
}

export type DialogueBaseProps = MessageListBaseProps<Message>;

export interface DialogueState extends MessageListState {
    selectedIds: Set<string>;
}

export default class DialogueFoundation<P extends DialogueBaseProps = DialogueBaseProps> extends MessageListFoundation<Message, DialogueAdapter<P>, P, DialogueState> {
    /** The list this dialogue last reported, so the `chats` change it causes is not reported again */
    #reported: Message[] | undefined;

    protected readonly completedStatus = strings.STATUS.COMPLETED;

    // the dialogue does not see the sends, so a new message stands for one
    protected override readonly resumeOnAppend = true;

    protected override notifyChats(chats: Message[]) {
        this.#reported = chats;
        super.notifyChats(chats);
    }

    static getInitialState(): DialogueState {
        return { backBottomVisible: false, selectedIds: new Set() };
    }

    /**
     * `user` holds without a bubble too, unlike Chat's: here it lays out the user's message and its reference icon, and
     * only `error` is a bubble color
     */
    static getContentFlags(role?: string, status?: string, mode?: string) {
        const user = role === strings.ROLE.USER;
        const bubble = mode === strings.MODE.BUBBLE || (mode === strings.MODE.USER_BUBBLE && user);
        return { bubble, user, error: status === strings.STATUS.FAILED && bubble };
    }

    /**
     * A `chats` change is reported through `notifyChatsChange` as well, unless it is the list this dialogue reported
     * itself. Compared by value: a reactive host hands over a copy (`followChats`), and Svelte proxies what a bindable
     * prop is assigned, items included.
     */
    override handlePropsChange(prev: Partial<P>) {
        const chats = this.getChats();
        const reported = this.#reported;
        this.#reported = undefined;
        if (this.getProp('chats') !== prev.chats && !(reported && isEqual(chats, reported))) {
            this.adapter.notifyChatsChange(chats);
        }
        super.handlePropsChange(prev);
    }

    handleSelectAll = () => {
        const selectedSet = new Set<string>(this.getChats().map((chat) => chat.id));
        this.setState({ selectedIds: selectedSet });
        this.adapter.notifySelect(Array.from(selectedSet));
    };

    handleDeselectAll = () => {
        this.setState({ selectedIds: new Set() });
        this.adapter.notifySelect([]);
    };

    handleSelectOrRemove = (isChecked: boolean, id: string) => {
        // messages deleted or replaced since the last change must not be reported as selected
        const existingIds = new Set(this.getChats().map((chat) => chat.id));
        const newSelectedSet = new Set<string>([...this.getStates().selectedIds].filter((selectedId) => existingIds.has(selectedId)));
        if (isChecked) {
            newSelectedSet.add(id);
        } else {
            newSelectedSet.delete(id);
        }
        this.setState({ selectedIds: newSelectedSet });
        this.adapter.notifySelect(Array.from(newSelectedSet));
    };

    resetMessage = (message: Message) => {
        const chats = this.getChats();
        const lastMessage = chats.at(-1);
        const newLastChat = {
            ...lastMessage,
            status: strings.STATUS.IN_PROGRESS,
            content: '',
            like: false,
            dislike: false,
            output_text: undefined,
            error: undefined,
            references: undefined,
            id: createId(),
            createdAt: Date.now(),
        };
        this.notifyChats(chats.slice(0, -1).concat(newLastChat));
        this.adapter.notifyMessageReset(message);
    };

    editMessage = (message: Message) => {
        const chats = this.getChats();
        this.adapter.notifyEditMessage(message);
        const newChats = chats.map((item) => {
            if (item.id === message.id) {
                return { ...item, editing: !item.editing };
            }
            return item.editing ? { ...item, editing: false } : item;
        });
        this.notifyChats(newChats);
    };

    onHintClick = (hint: string) => {
        const newMessage = {
            role: strings.ROLE.USER,
            id: createId(),
            createdAt: Date.now(),
            content: hint,
        };
        this.notifyChats([...this.getChats(), newMessage]);
        this.adapter.notifyHintClick(hint);
    };
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
