import React, { type ReactNode } from 'react';
import type { Annotation, InputFile, InputImage, Message, Reference } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import type { MessageContent } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
import type { AvatarProps } from '@fibrae/semi-ui-react/avatar/index';
import type { MarkdownRenderProps as OriginMarkdownRenderProps } from '@fibrae/semi-ui-react/markdown-render/index';

// raw and ref belong to each message's own renderer
export type MarkdownRenderProps = Partial<Omit<OriginMarkdownRenderProps, 'raw' | 'ref'>>;

export type { Message };

export interface AIChatDialogueProps extends ElementProps<'div', 'onSelect'> {
    align?: 'leftRight' | 'leftAlign';
    chats?: Message[];
    className?: string;
    disabledFileItemClick?: boolean;
    escapeHtml?: boolean;
    hintCls?: string;
    hints?: string[];
    hintStyle?: React.CSSProperties;
    selecting?: boolean;
    markdownRenderProps?: MarkdownRenderProps;
    messageEditRender?: (props: MessageContent) => ReactNode;
    mode?: 'bubble' | 'noBubble' | 'userBubble';
    onAnnotationClick?: (annotations: Annotation[]) => void;
    onChatsChange?: (chats: Message[]) => void;
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
    dialogueRenderConfig?: DialogueRenderConfig;
    renderDialogueContentItem?: DialogueContentItemRendererMap;
    renderHintBox?: (props: { content: string; index: number; onHintClick: () => void }) => React.ReactNode;
    roleConfig: RoleConfig;
    showReset?: boolean;
    showReference?: boolean;
    style?: React.CSSProperties;
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

export interface AIChatDialogueItemProps extends Omit<AIChatDialogueProps, 'role' | 'roleConfig'> {
    continueSend?: boolean;
    isLastChat?: boolean;
    isSelected?: boolean;
    message: Message;
    onSelectChange?: (isChecked: boolean, item: string) => void;
    role: Metadata;
}

export interface DialogueContentProps {
    mode?: 'bubble' | 'noBubble' | 'userBubble';
    children?: string;
    escapeHtml?: boolean;
    role?: Metadata;
    message?: Message;
    customRenderFunc?: (props: RenderContentProps) => ReactNode;
    markdownRenderProps?: MarkdownRenderProps;
    editing?: boolean;
    messageEditRender?: (props: MessageContent) => ReactNode;
    onFileClick?: (file?: InputFile) => void;
    onImageClick?: (image?: InputImage) => void;
    disabledFileItemClick?: boolean;
    onAnnotationClick?: (annotations: Annotation[]) => void;
    onReferenceClick?: AIChatDialogueProps['onReferenceClick'];
    renderDialogueContentItem?: DialogueContentItemRendererMap;
    showReference?: boolean;
}

export interface AIChatDialogueActionProps {
    customRenderFunc?: (props: RenderActionProps) => ReactNode;
    isLastChat?: boolean;
    message?: Message;
    messageEditRender?: (props: MessageContent) => ReactNode;
    onMessageBadFeedback?: (message?: Message) => void;
    onMessageCopy?: (message?: Message) => void;
    onMessageDelete?: (message?: Message) => void;
    onMessageEdit?: (message?: Message) => void;
    onMessageGoodFeedback?: (message?: Message) => void;
    onMessageReset?: (message?: Message) => void;
    onMessageShare?: (message?: Message) => void;
    role?: Metadata;
    showReset?: boolean;
    className?: string;
}

export interface DialogueRenderConfig {
    renderDialogueAction?: (props: RenderActionProps) => ReactNode;
    renderDialogueAvatar?: (props: RenderAvatarProps) => ReactNode;
    renderDialogueContent?: (props: RenderContentProps) => ReactNode;
    renderDialogueTitle?: (props: RenderTitleProps) => ReactNode;
    renderFullDialogue?: (props: RenderFullDialogueProps) => ReactNode;
}

export interface RenderTitleProps {
    defaultTitle?: ReactNode;
    message?: Message;
    role?: Metadata;
}

export interface RenderAvatarProps {
    defaultAvatar?: ReactNode;
    message?: Message;
    role?: Metadata;
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
    dislikeNode?: ReactNode;
    editNode?: ReactNode;
    likeNode?: ReactNode;
    moreNode?: ReactNode;
    resetNode?: ReactNode;
    shareNode?: ReactNode;
}

export interface RenderActionProps {
    message?: Message;
    defaultActions?: ReactNode | ReactNode[];
    className: string;
    defaultActionsObj?: DefaultActionNodeObj;
}

export interface RenderFullDialogueProps {
    message?: Message;
    role?: Metadata;
    defaultNodes?: FullDialogueNodes;
    className: string;
}

export interface FullDialogueNodes {
    avatar?: ReactNode;
    title?: ReactNode;
    content?: ReactNode;
    action?: ReactNode;
}

export interface RoleConfig {
    user?: Metadata | Map<string, Metadata>;
    assistant?: Metadata | Map<string, Metadata>;
    system?: Metadata | Map<string, Metadata>;
    [x: string]: Metadata | Map<string, Metadata> | undefined;
}

export interface Metadata {
    name?: string;
    avatar?: string;
    color?: AvatarProps['color'];
    [x: string]: any;
}

export type DialogueContentItemRenderer = (item: any, message?: Message) => ReactNode;
export type DialogueContentItemRendererMap = Record<string, DialogueContentItemRenderer | Record<string, DialogueContentItemRenderer>>;
