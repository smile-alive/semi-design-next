import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Annotation, ContentItem, InputFile, InputImage, InputMessage, InputText, Message, OutputMessage, OutputText, Reference, Refusal, Step } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import type { MessageContent } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { AvatarProps } from '@fibrae/semi-ui-svelte/avatar/interface';
import type { MarkdownRenderProps as OriginMarkdownRenderProps } from '@fibrae/semi-ui-svelte/markdown-render/interface';

// raw belongs to each message's own renderer; class and style reach each renderer's root
export type MarkdownRenderProps = Partial<Omit<OriginMarkdownRenderProps, 'raw'>>;

export type { Message };

export interface Metadata {
    name?: string;
    avatar?: string;
    color?: AvatarProps['color'];
    [x: string]: unknown;
}

export interface RoleConfig {
    user?: Metadata | Map<string, Metadata>;
    assistant?: Metadata | Map<string, Metadata>;
    system?: Metadata | Map<string, Metadata>;
    [x: string]: Metadata | Map<string, Metadata> | undefined;
}

export interface AIChatDialogueTitleSnippetProps {
    /** The built-in title */
    defaultTitle: Snippet;
    message: Message;
    role?: Metadata;
}

export interface AIChatDialogueAvatarSnippetProps {
    /** The built-in avatar */
    defaultAvatar: Snippet;
    message: Message;
    role?: Metadata;
}

export interface AIChatDialogueContentSnippetProps {
    message: Message;
    role?: Metadata;
    /** The built-in content */
    defaultContent: Snippet;
    class: string;
}

/** The buttons the default action bar shows for the message; a key is missing when its button is not shown */
export interface DefaultActionNodeObj {
    copyNode?: Snippet;
    dislikeNode?: Snippet;
    editNode?: Snippet;
    likeNode?: Snippet;
    moreNode?: Snippet;
    resetNode?: Snippet;
    shareNode?: Snippet;
}

export interface AIChatDialogueActionSnippetProps {
    message: Message;
    defaultActions: Snippet[];
    defaultActionsObj: DefaultActionNodeObj;
    class: string;
}

export interface FullDialogueNodes {
    avatar: Snippet;
    title: Snippet;
    content: Snippet;
    action: Snippet;
}

export interface AIChatDialogueFullDialogueSnippetProps {
    message: Message;
    role?: Metadata;
    defaultNodes: FullDialogueNodes;
    class: string;
}

/** An item inside a message item's content array */
export type MessageInnerItem = InputText | InputImage | InputFile | OutputText | Refusal;

export interface AIChatDialogueContentItemSnippetProps {
    /** A top-level content item, or an item inside a message item's content (then `parent` is that message item) */
    item: ContentItem | MessageInnerItem;
    /** The item's type; a top-level item without one counts as 'message' */
    type?: string;
    message: Message;
    index: number;
    parent?: InputMessage | OutputMessage;
    /** The built-in rendering of the item, for the types the snippet leaves alone */
    defaultItem: Snippet;
    /** The class of a custom-rendered item; the dialogue adds no wrapper, as it cannot tell whether the snippet rendered anything */
    class: string;
}

export interface AIChatDialogueMessageTextSnippetProps {
    text: string;
    message: Message;
}

export interface AIChatDialogueHintBoxSnippetProps {
    content: string;
    index: number;
    onHintClick: () => void;
}

export type AIChatDialogueMessageEditSnippetProps = MessageContent;

// title, content and the lower-case event attributes are Semi's own snippets and callbacks here
export interface AIChatDialogueProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'content' | 'onselect'> {
    align?: 'leftRight' | 'leftAlign';
    /** Bindable; deleting a message writes the new list back before `onChatsChange` */
    chats?: Message[];
    disabledFileItemClick?: boolean;
    escapeHtml?: boolean;
    hintCls?: string;
    hints?: string[];
    hintStyle?: string;
    selecting?: boolean;
    markdownRenderProps?: MarkdownRenderProps;
    mode?: 'bubble' | 'noBubble' | 'userBubble';
    roleConfig: RoleConfig;
    showReset?: boolean;
    showReference?: boolean;
    onChatsChange?: (chats: Message[]) => void;
    onAnnotationClick?: (annotations: Annotation[]) => void;
    onFileClick?: (file?: InputFile) => void;
    onHintClick?: (hint: string) => void;
    onImageClick?: (image?: InputImage) => void;
    onMessageBadFeedback?: (message?: Message) => void;
    onMessageCopy?: (message?: Message) => void;
    onMessageDelete?: (message?: Message) => void;
    onMessageEdit?: (message?: Message) => void;
    onMessageGoodFeedback?: (message?: Message) => void;
    onMessageReset?: (message?: Message) => void;
    onMessageShare?: (message?: Message) => void;
    // not a Reference yet: the consumer assigns the id, and AIChatInput picks the icon of a typeless file by suffix
    onReferenceClick?: (item: Partial<Reference>) => void;
    onSelect?: (selectedIds: string[]) => void;
    avatar?: Snippet<[AIChatDialogueAvatarSnippetProps]>;
    title?: Snippet<[AIChatDialogueTitleSnippetProps]>;
    content?: Snippet<[AIChatDialogueContentSnippetProps]>;
    action?: Snippet<[AIChatDialogueActionSnippetProps]>;
    fullDialogue?: Snippet<[AIChatDialogueFullDialogueSnippetProps]>;
    /** Renders every content item; a snippet's output cannot be inspected, so it renders `defaultItem` for the items it leaves alone */
    contentItem?: Snippet<[AIChatDialogueContentItemSnippetProps]>;
    /** Replaces the markdown rendering of a message whose content is plain text */
    messageText?: Snippet<[AIChatDialogueMessageTextSnippetProps]>;
    /** The editor shown while a user message is being edited */
    messageEdit?: Snippet<[AIChatDialogueMessageEditSnippetProps]>;
    hintBox?: Snippet<[AIChatDialogueHintBoxSnippetProps]>;
}

export interface AnnotationItemProps {
    title?: string;
    logo?: string;
    url?: string;
    detail?: string;
}

// the lowercase onclick stays a native listener of the root; onClick also fires on Enter and Space
export interface AnnotationWidgetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    maxCount: number;
    annotation: AnnotationItemProps[] | Annotation[];
    description?: string;
    onClick?: (event: MouseEvent | KeyboardEvent, items: AnnotationItemProps[]) => void;
}

export interface ReasoningPart {
    text?: string;
    type?: string;
}

export interface ReasoningWidgetContentSnippetProps {
    status?: string;
    summary?: ReasoningPart[];
    content?: ReasoningPart[];
    markdownRenderProps?: MarkdownRenderProps;
}

// `content` is the reasoning data, so the snippet that replaces the body is `children`
export interface ReasoningWidgetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'content'> {
    status?: string;
    summary?: ReasoningPart[];
    content?: ReasoningPart[];
    markdownRenderProps?: MarkdownRenderProps;
    /** Replaces the markdown body */
    children?: Snippet<[ReasoningWidgetContentSnippetProps]>;
}

/** A step action holds data only; its icon comes from the `actionIcon` snippet */
export interface DialogueStepAction {
    status?: string;
    summary?: string;
    description?: string;
    [key: string]: unknown;
}

export interface DialogueStep extends Omit<Step, 'actions'> {
    actions?: DialogueStepAction[];
}

export interface DialogueStepWidgetActionIconSnippetProps {
    item: DialogueStepAction;
    index: number;
    step: DialogueStep;
    stepIndex: number;
}

export interface DialogueStepWidgetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    steps: DialogueStep[];
    /** Shown before each action's description */
    actionIcon?: Snippet<[DialogueStepWidgetActionIconSnippetProps]>;
}
