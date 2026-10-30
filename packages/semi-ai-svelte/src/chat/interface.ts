import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ChatAlign, ChatMode, SendHotKey } from '@fibrae/semi-ai-foundation/chat/constants';
import type { Content, EnableUploadProps, Message } from '@fibrae/semi-ai-foundation/chat/foundation';
import type { AvatarProps } from '@fibrae/semi-ui-svelte/avatar/interface';
import type { MarkdownRenderComponents, MarkdownRenderProps } from '@fibrae/semi-ui-svelte/markdown-render/interface';
import type { TooltipProps } from '@fibrae/semi-ui-svelte/tooltip/interface';
import type { FileItem, UploadProps } from '@fibrae/semi-ui-svelte/upload/interface';

export type { ChatAlign, ChatMode, SendHotKey };
export type ChatMessage = Message;
export type ChatContent = Content;
export type ChatEnableUploadProps = EnableUploadProps;

export interface ChatMetadata {
    name?: string;
    /** Image URL; a custom avatar node goes through the `roleAvatar` snippet */
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
export type ChatMarkdownRenderProps = Partial<Omit<MarkdownRenderProps, 'raw' | 'components'>>;

/**
 * Chat owns the Upload's file list and calls `onChange` itself when an attachment is added or removed; the other
 * Upload props and callbacks pass through. The trigger content is the `uploadButton` snippet, and `action` falls back
 * to an empty string, as nothing is uploaded unless a `customRequest` or an `action` is given.
 */
export type ChatUploadProps = Partial<Omit<UploadProps, 'fileList' | 'children'>>;

export interface ChatInputChangeProps {
    inputValue: string;
    attachment: FileItem[];
}

export interface ChatHandle {
    resetMessage: () => void;
    clearContext: () => void;
    /** `animation` true scrolls smoothly, otherwise jumps */
    scrollToBottom: (animation?: boolean) => void;
    sendMessage: (content: string, attachment?: FileItem[]) => void;
}

export interface ChatTitleSnippetProps {
    message: ChatMessage;
    role: ChatMetadata;
    /** The built-in title */
    defaultTitle: Snippet;
}

export interface ChatAvatarSnippetProps {
    message: ChatMessage;
    role: ChatMetadata;
    /** The built-in avatar */
    defaultAvatar: Snippet;
}

export interface ChatRoleAvatarSnippetProps {
    message: ChatMessage;
    role: ChatMetadata;
}

export interface ChatContentSnippetProps {
    message: ChatMessage;
    role: ChatMetadata;
    /** The built-in content */
    defaultContent: Snippet;
    class: string;
}

/** The buttons the default action bar shows for the message; a key is missing when its button is not shown */
export interface ChatDefaultActionNodeObj {
    copyNode?: Snippet;
    likeNode?: Snippet;
    dislikeNode?: Snippet;
    resetNode?: Snippet;
    deleteNode?: Snippet;
}

export interface ChatActionSnippetProps {
    message: ChatMessage;
    defaultActions: Snippet[];
    defaultActionsObj: ChatDefaultActionNodeObj;
    class: string;
}

/** Each part as the message would render it, including what the avatar, title, content and action snippets give */
export interface ChatFullChatBoxNodes {
    avatar: Snippet;
    title: Snippet;
    content: Snippet;
    action: Snippet;
}

export interface ChatFullChatBoxSnippetProps {
    message: ChatMessage;
    role: ChatMetadata;
    defaultNodes: ChatFullChatBoxNodes;
    class: string;
}

export interface ChatInputAreaSnippetProps {
    defaultNode: Snippet;
    clearContextNode: Snippet;
    /** null when every upload way is off */
    uploadNode: Snippet | null;
    inputNode: Snippet;
    sendNode: Snippet;
    onSend: (content?: string, attachment?: FileItem[]) => void;
    onClear: () => void;
    /** Focuses the input */
    onClick: () => void;
}

export interface ChatHintBoxSnippetProps {
    content: string;
    index: number;
    onHintClick: () => void;
}

export interface ChatDividerSnippetProps {
    message: ChatMessage;
}

// title and content are Semi's own snippets here, so the native attributes of those names are left out
export interface ChatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'content' | 'children'> {
    /** Bindable; a sent message, a like, a reset, a clear or a delete writes the new list back before `onChatsChange` */
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
    /** The tooltip of the upload button; its text is the `uploadTip` snippet */
    uploadTipProps?: Omit<TooltipProps, 'content' | 'children' | 'child'>;
    markdownRenderProps?: ChatMarkdownRenderProps;
    customMarkDownComponents?: MarkdownRenderComponents;
    inputBoxCls?: string;
    inputBoxStyle?: string;
    hintCls?: string;
    hintStyle?: string;
    onChatsChange?: (chats: ChatMessage[]) => void;
    onMessageSend?: (content: string, attachment?: FileItem[]) => void;
    onMessageCopy?: (message: ChatMessage) => void;
    onMessageGoodFeedback?: (message: ChatMessage) => void;
    onMessageBadFeedback?: (message: ChatMessage) => void;
    /** `message` is null when the reset comes from the `resetMessage` handle method */
    onMessageReset?: (message: ChatMessage | null) => void;
    onMessageDelete?: (message: ChatMessage) => void;
    onClear?: () => void;
    onHintClick?: (hint: string) => void;
    onInputChange?: (props: ChatInputChangeProps) => void;
    onStopGenerator?: (event: MouseEvent) => void;
    topSlot?: Snippet;
    bottomSlot?: Snippet;
    /** Provided and empty hides the title */
    title?: Snippet<[ChatTitleSnippetProps]>;
    /** Provided and empty hides the avatar */
    avatar?: Snippet<[ChatAvatarSnippetProps]>;
    /** The avatar content for a role without an image URL */
    roleAvatar?: Snippet<[ChatRoleAvatarSnippetProps]>;
    content?: Snippet<[ChatContentSnippetProps]>;
    action?: Snippet<[ChatActionSnippetProps]>;
    fullChatBox?: Snippet<[ChatFullChatBoxSnippetProps]>;
    inputArea?: Snippet<[ChatInputAreaSnippetProps]>;
    hintBox?: Snippet<[ChatHintBoxSnippetProps]>;
    divider?: Snippet<[ChatDividerSnippetProps]>;
    /** Replaces the upload button */
    uploadButton?: Snippet;
    /** The upload button's tooltip text */
    uploadTip?: Snippet;
}
