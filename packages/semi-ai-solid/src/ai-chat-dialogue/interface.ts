import type { JSX, Ref } from 'solid-js';
import type { Annotation, InputFile, InputImage, Message, Reference } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import type { MessageContent } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import type { AvatarProps } from '@fibrae/semi-ui-solid/avatar/index';
import type { MarkdownRenderProps as OriginMarkdownRenderProps } from '@fibrae/semi-ui-solid/markdown-render/index';

// raw and ref belong to each message's own renderer
export type MarkdownRenderProps = Partial<Omit<OriginMarkdownRenderProps, 'raw' | 'ref'>>;

export type { Message };

/** Methods exposed on the AIChatDialogue ref */
export interface AIChatDialogueHandle {
    selectAll: () => void;
    deselectAll: () => void;
    /** Scrolls the message list to the bottom, animated when `animation` is true */
    scrollToBottom: (animation: boolean) => void;
    /** Scrolls the message list to the top, animated when `animation` is true */
    scrollToTop: (animation: boolean) => void;
}

/** The root element, carrying the handle methods */
export type AIChatDialogueElement = HTMLDivElement & AIChatDialogueHandle;

export interface RenderHintBoxProps {
    content: string;
    index: number;
    onHintClick: () => void;
}

export interface AIChatDialogueProps extends ElementProps<'div', 'onSelect' | 'ref'> {
    ref?: Ref<AIChatDialogueElement>;
    align?: 'leftRight' | 'leftAlign';
    chats?: Message[];
    disabledFileItemClick?: boolean;
    escapeHtml?: boolean;
    hintCls?: string;
    hints?: string[];
    hintStyle?: JSX.CSSProperties | string;
    selecting?: boolean;
    markdownRenderProps?: MarkdownRenderProps;
    messageEditRender?: (props: MessageContent) => JSX.Element;
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
    renderHintBox?: (props: RenderHintBoxProps) => JSX.Element;
    roleConfig: RoleConfig;
    showReset?: boolean;
    showReference?: boolean;
}

export interface DialogueRenderConfig {
    renderDialogueAction?: (props: RenderActionProps) => JSX.Element;
    renderDialogueAvatar?: (props: RenderAvatarProps) => JSX.Element;
    renderDialogueContent?: (props: RenderContentProps) => JSX.Element;
    renderDialogueTitle?: (props: RenderTitleProps) => JSX.Element;
    renderFullDialogue?: (props: RenderFullDialogueProps) => JSX.Element;
}

export interface RenderTitleProps {
    /** Creates the default title; call it where it is inserted */
    defaultTitle?: () => JSX.Element;
    message?: Message;
    role?: Metadata;
}

export interface RenderAvatarProps {
    /** Creates the default avatar; call it where it is inserted */
    defaultAvatar?: () => JSX.Element;
    message?: Message;
    role?: Metadata;
}

export interface RenderContentProps {
    message?: Message;
    role?: Metadata;
    /** Creates the default content; call it where it is inserted */
    defaultContent?: () => JSX.Element;
    class?: string;
}

/**
 * Render functions of the buttons the default action bar shows for the message; a key is missing when its button is
 * not shown. Each call creates the button, so call one where it is inserted
 */
export interface DefaultActionNodeObj {
    copyNode?: () => JSX.Element;
    dislikeNode?: () => JSX.Element;
    editNode?: () => JSX.Element;
    likeNode?: () => JSX.Element;
    moreNode?: () => JSX.Element;
    resetNode?: () => JSX.Element;
    shareNode?: () => JSX.Element;
}

export interface RenderActionProps {
    message?: Message;
    /** Render functions of the default buttons in display order; call each where it is inserted */
    defaultActions?: (() => JSX.Element)[];
    class: string;
    defaultActionsObj?: DefaultActionNodeObj;
}

export interface RenderFullDialogueProps {
    message?: Message;
    role?: Metadata;
    defaultNodes?: FullDialogueNodes;
    class: string;
}

/** Each function creates its node on every call; call one where it is inserted, and the ones left out are never created */
export interface FullDialogueNodes {
    avatar?: () => JSX.Element;
    title?: () => JSX.Element;
    content?: () => JSX.Element;
    action?: () => JSX.Element;
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

export type DialogueContentItemRenderer = (item: any, message?: Message) => JSX.Element;
export type DialogueContentItemRendererMap = Record<string, DialogueContentItemRenderer | Record<string, DialogueContentItemRenderer>>;
