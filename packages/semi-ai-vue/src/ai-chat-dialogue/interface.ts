import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { Annotation, ContentItem, InputFile, InputImage, InputMessage, InputText, Message, OutputMessage, OutputText, Reference, Refusal, Step } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import type { MessageContent } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { AvatarProps } from '@fibrae/semi-ui-vue/avatar/index';
import type { MarkdownRenderProps as OriginMarkdownRenderProps } from '@fibrae/semi-ui-vue/markdown-render/interface';

// raw belongs to each message's own renderer; class and style reach each renderer's root as in React
export type MarkdownRenderProps = Partial<Omit<OriginMarkdownRenderProps, 'raw'>> & {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
};

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

export interface AIChatDialogueProps {
    align?: 'leftRight' | 'leftAlign';
    chats?: Message[];
    disabledFileItemClick?: boolean;
    escapeHtml?: boolean;
    hintCls?: string;
    hints?: string[];
    hintStyle?: StyleValue;
    selecting?: boolean;
    markdownRenderProps?: MarkdownRenderProps;
    mode?: 'bubble' | 'noBubble' | 'userBubble';
    roleConfig: RoleConfig;
    showReset?: boolean;
    showReference?: boolean;
}

export interface AIChatDialogueEmits {
    'update:chats': [chats: Message[]];
    chatsChange: [chats: Message[]];
    annotationClick: [annotations: Annotation[]];
    fileClick: [file?: InputFile];
    hintClick: [hint: string];
    imageClick: [image?: InputImage];
    messageBadFeedback: [message?: Message];
    messageCopy: [message?: Message];
    messageDelete: [message?: Message];
    messageEdit: [message?: Message];
    messageGoodFeedback: [message?: Message];
    messageReset: [message?: Message];
    messageShare: [message?: Message];
    // not a Reference yet: the consumer assigns the id, and AIChatInput picks the icon of a typeless file by suffix
    referenceClick: [item: Partial<Reference>];
    select: [selectedIds: string[]];
}

/** Methods exposed on the AIChatDialogue ref */
export interface AIChatDialogueHandle {
    selectAll: () => void;
    deselectAll: () => void;
    /** Scrolls the message list to the bottom, animated when `animation` is true */
    scrollToBottom: (animation: boolean) => void;
    /** Scrolls the message list to the top, animated when `animation` is true */
    scrollToTop: (animation: boolean) => void;
}

export interface AIChatDialogueTitleSlotProps {
    defaultTitle: VNode;
    message: Message;
    role?: Metadata;
}

export interface AIChatDialogueAvatarSlotProps {
    defaultAvatar: VNode;
    message: Message;
    role?: Metadata;
}

export interface AIChatDialogueContentSlotProps {
    message: Message;
    role?: Metadata;
    defaultContent: VNode;
    class: string;
}

/** The buttons the default action bar shows for the message; a key is missing when its button is not shown */
export interface DefaultActionNodeObj {
    copyNode?: VNode;
    dislikeNode?: VNode;
    editNode?: VNode;
    likeNode?: VNode;
    moreNode?: VNode;
    resetNode?: VNode;
    shareNode?: VNode;
}

export interface AIChatDialogueActionSlotProps {
    message: Message;
    defaultActions: VNode[];
    defaultActionsObj: DefaultActionNodeObj;
    class: string;
}

export interface FullDialogueNodes {
    avatar: VNode;
    title: VNode;
    content: VNode;
    action: VNode;
}

export interface AIChatDialogueFullDialogueSlotProps {
    message: Message;
    role?: Metadata;
    defaultNodes: FullDialogueNodes;
    class: string;
}

/** An item inside a message item's content array */
export type MessageInnerItem = InputText | InputImage | InputFile | OutputText | Refusal;

export interface AIChatDialogueContentItemSlotProps {
    /** A top-level content item, or an item inside a message item's content (then `parent` is that message item) */
    item: ContentItem | MessageInnerItem;
    /** The item's type; a top-level item without one counts as 'message' */
    type?: string;
    message: Message;
    index: number;
    parent?: InputMessage | OutputMessage;
}

export interface AIChatDialogueMessageTextSlotProps {
    text: string;
    message: Message;
}

export interface AIChatDialogueHintBoxSlotProps {
    content: string;
    index: number;
    onHintClick: () => void;
}

export type AIChatDialogueMessageEditSlotProps = MessageContent;

export interface AIChatDialogueSlots {
    avatar?: (props: AIChatDialogueAvatarSlotProps) => VNode[];
    title?: (props: AIChatDialogueTitleSlotProps) => VNode[];
    content?: (props: AIChatDialogueContentSlotProps) => VNode[];
    action?: (props: AIChatDialogueActionSlotProps) => VNode[];
    fullDialogue?: (props: AIChatDialogueFullDialogueSlotProps) => VNode[];
    /** Called for every content item; an empty result leaves the item to the built-in rendering */
    contentItem?: (props: AIChatDialogueContentItemSlotProps) => VNode[];
    /** Replaces the markdown rendering of a message whose content is plain text */
    messageText?: (props: AIChatDialogueMessageTextSlotProps) => VNode[];
    /** The editor shown while a user message is being edited */
    messageEdit?: (props: AIChatDialogueMessageEditSlotProps) => VNode[];
    hintBox?: (props: AIChatDialogueHintBoxSlotProps) => VNode[];
}

export interface AnnotationItemProps {
    title?: string;
    logo?: string;
    url?: string;
    detail?: string;
}

export interface AnnotationWidgetProps {
    maxCount: number;
    annotation: AnnotationItemProps[] | Annotation[];
    description?: string;
}

export interface AnnotationWidgetEmits {
    click: [event: MouseEvent | KeyboardEvent, items: AnnotationItemProps[]];
}

export interface ReasoningWidgetProps {
    status?: string;
    summary?: { text?: string; type?: string }[];
    content?: { text?: string; type?: string }[];
    markdownRenderProps?: MarkdownRenderProps;
}

export type ReasoningWidgetContentSlotProps = ReasoningWidgetProps;

export interface ReasoningWidgetSlots {
    /** Replaces the markdown rendering of the reasoning text */
    content?: (props: ReasoningWidgetContentSlotProps) => VNode[];
}

/** A step action holds data only; its icon comes from the `#actionIcon` slot */
export interface DialogueStepAction {
    status?: string;
    summary?: string;
    description?: string;
    [key: string]: unknown;
}

export interface DialogueStep extends Omit<Step, 'actions'> {
    actions?: DialogueStepAction[];
}

export interface DialogueStepWidgetProps {
    steps: DialogueStep[];
}

export interface DialogueStepWidgetActionIconSlotProps {
    item: DialogueStepAction;
    index: number;
    step: DialogueStep;
    stepIndex: number;
}

export interface DialogueStepWidgetSlots {
    /** Shown before each action's description */
    actionIcon?: (props: DialogueStepWidgetActionIconSlotProps) => VNode[];
}
