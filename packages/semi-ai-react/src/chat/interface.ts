import React, { type ReactNode } from 'react';
import type { ChatAlign, ChatMode, SendHotKey } from '@fibrae/semi-ai-foundation/chat/constants';
import type { EnableUploadProps, Message } from '@fibrae/semi-ai-foundation/chat/foundation';
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
import type { AvatarProps } from '@fibrae/semi-ui-react/avatar/index';
import type { MarkdownRenderProps as OriginMarkdownRenderProps } from '@fibrae/semi-ui-react/markdown-render/index';
import type { TooltipProps } from '@fibrae/semi-ui-react/tooltip/index';
import type { FileItem, UploadHandle, UploadProps } from '@fibrae/semi-ui-react/upload/index';

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
    onMessageReset?: (message?: Message) => void;
    onMessageCopy?: (message?: Message) => void;
    chatBoxRenderConfig?: ChatBoxRenderConfig;
    customMarkDownComponents?: OriginMarkdownRenderProps['components'];
    renderDivider?: (message?: Message) => ReactNode;
    markdownRenderProps?: MarkdownRenderProps;
}

export interface ChatHandle {
    resetMessage: () => void;
    clearContext: () => void;
    /** `animation` true scrolls smoothly, otherwise jumps */
    scrollToBottom: (animation?: boolean) => void;
    sendMessage: (content: string, attachment?: FileItem[]) => void;
}

export interface ChatProps extends CommonChatsProps, ElementProps<'div', 'children'> {
    /** Methods of the chat; not a DOM element */
    ref?: React.Ref<ChatHandle>;
    style?: React.CSSProperties;
    className?: string;
    canSend?: boolean;
    hints?: string[];
    renderHintBox?: (props: { content: string; index: number; onHintClick: () => void }) => React.ReactNode;
    onHintClick?: (hint: string) => void;
    onChatsChange?: (chats: Message[]) => void;
    onStopGenerator?: (e: React.MouseEvent) => void;
    customMarkDownComponents?: OriginMarkdownRenderProps['components'];
    onClear?: () => void;
    onInputChange?: (props: { inputValue: string; attachment: FileItem[] }) => void;
    onMessageSend?: (content: string, attachment?: FileItem[]) => void;
    inputBoxStyle?: React.CSSProperties;
    inputBoxCls?: string;
    renderInputArea?: (props?: RenderInputAreaProps) => ReactNode;
    placeholder?: string;
    topSlot?: ReactNode | ReactNode[];
    bottomSlot?: ReactNode | ReactNode[];
    showStopGenerate?: boolean;
    hintStyle?: React.CSSProperties;
    hintCls?: string;
    uploadProps?: Omit<UploadProps, 'fileList' | 'defaultFileList'>;
    uploadTipProps?: TooltipProps;
    showClearContext?: boolean;
    sendHotKey?: SendHotKey;
    enableUpload?: boolean | EnableUploadProps;
}

export interface RenderInputAreaProps {
    defaultNode?: ReactNode;
    onSend?: (content?: string, attachment?: FileItem[]) => void;
    onClear?: (e?: any) => void;
    detailProps?: {
        clearContextNode?: ReactNode;
        uploadNode?: ReactNode;
        inputNode?: ReactNode;
        sendNode?: ReactNode;
        /** Focuses the input */
        onClick?: () => void;
    };
}

export interface RenderTitleProps {
    message?: Message;
    role?: Metadata;
    defaultTitle?: ReactNode;
}

export interface RenderAvatarProps {
    message?: Message;
    role?: Metadata;
    defaultAvatar?: ReactNode;
}

export interface RenderContentProps {
    message?: Message;
    role?: Metadata;
    defaultContent?: ReactNode | ReactNode[];
    className?: string;
}

/** The buttons the default action bar shows for the message; a key is missing when its button is not shown */
export interface DefaultActionNodeObj {
    copyNode?: ReactNode;
    likeNode?: ReactNode;
    dislikeNode?: ReactNode;
    resetNode?: ReactNode;
    deleteNode?: ReactNode;
}

export interface RenderActionProps {
    message?: Message;
    defaultActions?: ReactNode | ReactNode[];
    className: string;
    defaultActionsObj?: DefaultActionNodeObj;
}

export interface RenderFullChatBoxProps {
    message?: Message;
    role?: Metadata;
    defaultNodes?: FullChatBoxNodes;
    className: string;
}

export interface ChatBoxRenderConfig {
    renderChatBoxTitle?: (props: RenderTitleProps) => ReactNode;
    renderChatBoxAvatar?: (props: RenderAvatarProps) => ReactNode;
    renderChatBoxContent?: (props: RenderContentProps) => ReactNode;
    renderChatBoxAction?: (props: RenderActionProps) => ReactNode;
    renderFullChatBox?: (props: RenderFullChatBoxProps) => ReactNode;
}

export interface FullChatBoxNodes {
    avatar?: ReactNode;
    title?: ReactNode;
    content?: ReactNode;
    action?: ReactNode;
}

export interface RoleConfig {
    user?: Metadata;
    assistant?: Metadata;
    system?: Metadata;
    [x: string]: Metadata | undefined;
}

export interface Metadata {
    name?: string;
    avatar?: ReactNode | string;
    color?: AvatarProps['color'];
    [x: string]: any;
}

export interface ChatState {
    backBottomVisible?: boolean;
    uploadAreaVisible?: boolean;
}

export interface ChatBoxProps extends Omit<CommonChatsProps, 'chats'> {
    toast?: any;
    style?: React.CSSProperties;
    className?: string;
    previousMessage?: Message;
    message?: Message;
    isLast?: boolean;
    customMarkDownComponents?: OriginMarkdownRenderProps['components'];
}

export interface InputBoxHandle {
    focus: () => void;
}

export interface InputBoxProps {
    ref?: React.Ref<InputBoxHandle>;
    canSend?: boolean;
    showClearContext?: boolean;
    sendHotKey?: SendHotKey;
    placeholder: string;
    className?: string;
    style?: React.CSSProperties;
    disableSend?: boolean;
    uploadRef?: React.RefObject<UploadHandle>;
    uploadTipProps?: TooltipProps;
    uploadProps?: UploadProps;
    renderInputArea?: (props: RenderInputAreaProps) => React.ReactNode;
    onSend?: (content: string, attachment: FileItem[]) => void;
    onClearContext?: (e: any) => void;
    onInputChange?: (props: { inputValue: string; attachment: FileItem[] }) => void;
    clickUpload?: boolean;
    dragUpload?: boolean;
    pasteUpload?: boolean;
}

export interface InputBoxState {
    content: string;
    attachment: FileItem[];
}
