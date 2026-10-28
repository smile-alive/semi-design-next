import type { JSX, Ref } from 'solid-js';
import type { ChatAlign, ChatMode, SendHotKey } from '@fibrae/semi-ai-foundation/chat/constants';
import type { EnableUploadProps, Message } from '@fibrae/semi-ai-foundation/chat/foundation';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import type { AvatarProps } from '@fibrae/semi-ui-solid/avatar/index';
import type { MarkdownRenderComponents, MarkdownRenderProps as OriginMarkdownRenderProps } from '@fibrae/semi-ui-solid/markdown-render/index';
import type { TooltipProps } from '@fibrae/semi-ui-solid/tooltip/index';
import type { FileItem, UploadProps } from '@fibrae/semi-ui-solid/upload/index';

export type MarkdownRenderProps = Partial<Omit<OriginMarkdownRenderProps, 'raw' | 'ref' | 'components'>>;

export type { Message } from '@fibrae/semi-ai-foundation/chat/foundation';

export interface CommonChatsProps {
    align?: ChatAlign;
    mode?: ChatMode;
    chats?: Message[];
    escapeHtml?: boolean;
    roleConfig?: RoleConfig;
    onMessageDelete?: (message?: Message) => void;
    onChatsChange?: (chats: Message[]) => void;
    onMessageBadFeedback?: (message?: Message) => void;
    onMessageGoodFeedback?: (message?: Message) => void;
    onMessageReset?: (message: Message | null) => void;
    onMessageCopy?: (message?: Message) => void;
    chatBoxRenderConfig?: ChatBoxRenderConfig;
    customMarkDownComponents?: MarkdownRenderComponents;
    /** Called once per divider message and each time the function is replaced */
    renderDivider?: (message?: Message) => JSX.Element;
    markdownRenderProps?: MarkdownRenderProps;
}

export interface ChatHandle {
    resetMessage: () => void;
    clearContext: () => void;
    /** `animation` true scrolls smoothly, otherwise jumps */
    scrollToBottom: (animation?: boolean) => void;
    sendMessage: (content: string, attachment?: FileItem[]) => void;
}

export type ChatElement = HTMLDivElement & ChatHandle;

export interface RenderHintBoxProps {
    readonly content: string;
    index: number;
    onHintClick: () => void;
}

export interface ChatProps extends CommonChatsProps, ElementProps<'div', 'children' | 'ref'> {
    /** The root element with the ChatHandle methods */
    ref?: Ref<ChatElement>;
    canSend?: boolean;
    hints?: string[];
    renderHintBox?: (props: RenderHintBoxProps) => JSX.Element;
    onHintClick?: (hint: string) => void;
    onStopGenerator?: (e: MouseEvent) => void;
    onClear?: () => void;
    onInputChange?: (props: { inputValue: string; attachment: FileItem[] }) => void;
    onMessageSend?: (content: string, attachment?: FileItem[]) => void;
    inputBoxStyle?: JSX.CSSProperties | string;
    inputBoxCls?: string;
    renderInputArea?: (props: RenderInputAreaProps) => JSX.Element;
    placeholder?: string;
    topSlot?: JSX.Element;
    bottomSlot?: JSX.Element;
    showStopGenerate?: boolean;
    hintStyle?: JSX.CSSProperties | string;
    hintCls?: string;
    uploadProps?: Omit<UploadProps, 'fileList' | 'defaultFileList'>;
    uploadTipProps?: TooltipProps;
    showClearContext?: boolean;
    sendHotKey?: SendHotKey;
    enableUpload?: boolean | EnableUploadProps;
}

/** Node fields are render functions: each call creates the node, so call one where it is inserted */
export interface RenderInputAreaProps {
    readonly defaultNode?: () => JSX.Element;
    onSend?: (content?: string, attachment?: FileItem[]) => void;
    onClear?: (e?: MouseEvent) => void;
    detailProps?: {
        readonly clearContextNode?: () => JSX.Element;
        readonly uploadNode?: () => JSX.Element;
        readonly inputNode?: () => JSX.Element;
        readonly sendNode?: () => JSX.Element;
        /** Focuses the input */
        onClick?: () => void;
    };
}

export interface RenderTitleProps {
    readonly message?: Message;
    readonly role?: Metadata;
    /** Creates the default title; call it where it is inserted */
    readonly defaultTitle?: () => JSX.Element;
}

export interface RenderAvatarProps {
    readonly message?: Message;
    readonly role?: Metadata;
    /** Creates the default avatar; call it where it is inserted */
    readonly defaultAvatar?: () => JSX.Element;
}

export interface RenderRoleAvatarProps {
    readonly message?: Message;
    readonly role?: Metadata;
}

export interface RenderContentProps {
    readonly message?: Message;
    readonly role?: Metadata;
    /** Creates the default content; call it where it is inserted */
    readonly defaultContent?: () => JSX.Element;
    readonly class?: string;
}

/** The buttons the default action bar shows for the message; a key is missing when its button is not shown */
export interface DefaultActionNodeObj {
    readonly copyNode?: () => JSX.Element;
    readonly likeNode?: () => JSX.Element;
    readonly dislikeNode?: () => JSX.Element;
    readonly resetNode?: () => JSX.Element;
    readonly deleteNode?: () => JSX.Element;
}

export interface RenderActionProps {
    readonly message?: Message;
    /** Render functions of the default buttons in display order; call each where it is inserted */
    readonly defaultActions?: (() => JSX.Element)[];
    readonly class: string;
    defaultActionsObj?: DefaultActionNodeObj;
}

export interface RenderFullChatBoxProps {
    readonly message?: Message;
    readonly role?: Metadata;
    defaultNodes?: FullChatBoxNodes;
    readonly class: string;
}

/**
 * Each function is called once per message and again when it is replaced; the fields of its argument are getters,
 * so the returned JSX follows the message as it streams. The action renderer is also called again when the set of
 * default buttons changes.
 */
export interface ChatBoxRenderConfig {
    renderChatBoxTitle?: (props: RenderTitleProps) => JSX.Element;
    renderChatBoxAvatar?: (props: RenderAvatarProps) => JSX.Element;
    /** The content of the built-in avatar, inside its circle */
    renderRoleAvatar?: (props: RenderRoleAvatarProps) => JSX.Element;
    renderChatBoxContent?: (props: RenderContentProps) => JSX.Element;
    renderChatBoxAction?: (props: RenderActionProps) => JSX.Element;
    renderFullChatBox?: (props: RenderFullChatBoxProps) => JSX.Element;
}

/** Each function creates its node on every call; call one where it is inserted, and the ones left out are never created */
export interface FullChatBoxNodes {
    readonly avatar?: () => JSX.Element;
    readonly title?: () => JSX.Element;
    readonly content?: () => JSX.Element;
    readonly action?: () => JSX.Element;
}

export interface RoleConfig {
    user?: Metadata;
    assistant?: Metadata;
    system?: Metadata;
    [x: string]: Metadata | undefined;
}

export interface Metadata {
    name?: string;
    /** Image URL; other avatar content goes through `chatBoxRenderConfig.renderRoleAvatar` */
    avatar?: string;
    color?: AvatarProps['color'];
    [x: string]: any;
}

export interface ChatState {
    backBottomVisible?: boolean;
    uploadAreaVisible?: boolean;
}
