import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { ChatAlign, ChatMode, SendHotKey } from '@fibrae/semi-ai-foundation/chat/constants';
import type { Content, EnableUploadProps, Message } from '@fibrae/semi-ai-foundation/chat/foundation';
import type { AvatarProps } from '@fibrae/semi-ui-vue/avatar/index';
import type { MarkdownRenderComponents, MarkdownRenderProps } from '@fibrae/semi-ui-vue/markdown-render/index';
import type { TooltipProps } from '@fibrae/semi-ui-vue/tooltip/index';
import type { FileItem, UploadEmits, UploadProps } from '@fibrae/semi-ui-vue/upload/index';

export type { ChatAlign, ChatMode, SendHotKey };
export type ChatMessage = Message;
export type ChatContent = Content;
export type ChatEnableUploadProps = EnableUploadProps;

export interface ChatMetadata {
    name?: string;
    /** Image URL; a custom avatar node goes through the `roleAvatar` slot */
    avatar?: string;
    /** Avatar background, for an avatar without an image */
    color?: AvatarProps['color'];
    [x: string]: unknown;
}

export interface ChatRoleConfig {
    user?: ChatMetadata;
    assistant?: ChatMetadata;
    system?: ChatMetadata;
    [x: string]: ChatMetadata | undefined;
}

/** raw and components belong to each message's own renderer; components come from customMarkDownComponents */
export type ChatMarkdownRenderProps = Partial<Omit<MarkdownRenderProps, 'raw' | 'components'>> & {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
};

/**
 * Chat owns the Upload's file list and calls `onChange` itself when an attachment is added or removed; the other
 * Upload listeners pass through.
 */
export type ChatUploadProps = Partial<Omit<UploadProps, 'fileList' | 'defaultFileList'>> & {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
} & {
    [K in Exclude<keyof UploadEmits, 'update:fileList'> as `on${Capitalize<K>}`]?: (...args: UploadEmits[K]) => void;
};

export interface ChatProps {
    /** Controlled list, for `v-model:chats` */
    chats?: ChatMessage[];
    align?: ChatAlign;
    mode?: ChatMode;
    roleConfig?: ChatRoleConfig;
    hints?: string[];
    sendHotKey?: SendHotKey;
    placeholder?: string;
    showStopGenerate?: boolean;
    showClearContext?: boolean;
    enableUpload?: boolean | ChatEnableUploadProps;
    /** Overrides the built-in send state when given */
    canSend?: boolean;
    /** Escapes HTML in the user's messages */
    escapeHtml?: boolean;
    uploadProps?: ChatUploadProps;
    /** The tooltip of the upload button; its text is the `uploadTip` slot */
    uploadTipProps?: Omit<TooltipProps, 'content'>;
    markdownRenderProps?: ChatMarkdownRenderProps;
    customMarkDownComponents?: MarkdownRenderComponents;
    inputBoxCls?: string;
    inputBoxStyle?: StyleValue;
    hintCls?: string;
    hintStyle?: StyleValue;
}

export interface ChatInputChangeProps {
    inputValue: string;
    attachment: FileItem[];
}

export interface ChatEmits {
    'update:chats': [chats: ChatMessage[]];
    chatsChange: [chats: ChatMessage[]];
    messageSend: [content: string, attachment?: FileItem[]];
    messageCopy: [message: ChatMessage];
    messageGoodFeedback: [message: ChatMessage];
    messageBadFeedback: [message: ChatMessage];
    /** `message` is null when the reset comes from the `resetMessage` handle method */
    messageReset: [message: ChatMessage | null];
    messageDelete: [message: ChatMessage];
    clear: [];
    hintClick: [hint: string];
    inputChange: [props: ChatInputChangeProps];
    stopGenerator: [event: MouseEvent];
}

export interface ChatHandle {
    resetMessage: () => void;
    clearContext: () => void;
    /** `animation` true scrolls smoothly, otherwise jumps */
    scrollToBottom: (animation?: boolean) => void;
    sendMessage: (content: string, attachment?: FileItem[]) => void;
}

export interface ChatTitleSlotProps {
    message: ChatMessage;
    role: ChatMetadata;
    defaultTitle: VNode;
}

export interface ChatAvatarSlotProps {
    message: ChatMessage;
    role: ChatMetadata;
    defaultAvatar: VNode;
}

export interface ChatRoleAvatarSlotProps {
    message: ChatMessage;
    role: ChatMetadata;
}

export interface ChatContentSlotProps {
    message: ChatMessage;
    role: ChatMetadata;
    defaultContent: VNode;
    class: string;
}

/** The buttons the default action bar shows for the message; a key is missing when its button is not shown */
export interface ChatDefaultActionNodeObj {
    copyNode?: VNode;
    likeNode?: VNode;
    dislikeNode?: VNode;
    resetNode?: VNode;
    deleteNode?: VNode;
}

export interface ChatActionSlotProps {
    message: ChatMessage;
    defaultActions: VNode[];
    defaultActionsObj: ChatDefaultActionNodeObj;
    class: string;
}

/** Each part as the message would render it, including what the avatar, title, content and action slots give */
export interface ChatFullChatBoxNodes {
    avatar: VNode;
    title: VNode;
    content: VNode;
    action: VNode;
}

export interface ChatFullChatBoxSlotProps {
    message: ChatMessage;
    role: ChatMetadata;
    defaultNodes: ChatFullChatBoxNodes;
    class: string;
}

export interface ChatInputAreaSlotProps {
    defaultNode: VNode;
    clearContextNode: VNode;
    /** null when every upload way is off */
    uploadNode: VNode | null;
    inputNode: VNode;
    sendNode: VNode;
    onSend: (content?: string, attachment?: FileItem[]) => void;
    onClear: () => void;
    /** Focuses the input */
    onClick: () => void;
}

export interface ChatHintBoxSlotProps {
    content: string;
    index: number;
    onHintClick: () => void;
}

export interface ChatDividerSlotProps {
    message: ChatMessage;
}

export interface ChatSlots {
    topSlot?: () => VNode[];
    bottomSlot?: () => VNode[];
    /** Provided and empty hides the title */
    title?: (props: ChatTitleSlotProps) => VNode[];
    /** Provided and empty hides the avatar */
    avatar?: (props: ChatAvatarSlotProps) => VNode[];
    /** The avatar content for a role without an image URL */
    roleAvatar?: (props: ChatRoleAvatarSlotProps) => VNode[];
    content?: (props: ChatContentSlotProps) => VNode[];
    action?: (props: ChatActionSlotProps) => VNode[];
    fullChatBox?: (props: ChatFullChatBoxSlotProps) => VNode[];
    inputArea?: (props: ChatInputAreaSlotProps) => VNode[];
    hintBox?: (props: ChatHintBoxSlotProps) => VNode[];
    divider?: (props: ChatDividerSlotProps) => VNode[];
    /** Replaces the upload button */
    uploadButton?: () => VNode[];
    /** The upload button's tooltip text */
    uploadTip?: () => VNode[];
}
