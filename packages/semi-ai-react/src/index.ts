import './semi-global';

export { default as Chat } from './chat';
export type {
    ChatProps,
    ChatHandle,
    Message as ChatMessage,
    RoleConfig as ChatRoleConfig,
    RenderInputAreaProps as ChatRenderInputAreaProps,
    RenderTitleProps as ChatRenderTitleProps,
    RenderAvatarProps as ChatRenderAvatarProps,
    RenderContentProps as ChatRenderContentProps,
    RenderActionProps as ChatRenderActionProps,
    RenderFullChatBoxProps as ChatRenderFullChatBoxProps,
    ChatBoxRenderConfig,
    Metadata as ChatMetadata,
    DefaultActionNodeObj as ChatDefaultActionNodeObj,
    FullChatBoxNodes as ChatFullChatBoxNodes,
} from './chat/interface';
export { default as AIChatDialogue } from './ai-chat-dialogue';
export type {
    AIChatDialogueProps,
    AIChatDialogueHandle,
    Message as AIChatDialogueMessage,
    RoleConfig as AIChatDialogueRoleConfig,
    DialogueContentItemRenderer,
    DialogueContentItemRendererMap,
    RenderTitleProps as AIChatDialogueRenderTitleProps,
    RenderAvatarProps as AIChatDialogueRenderAvatarProps,
    RenderContentProps as AIChatDialogueRenderContentProps,
    RenderActionProps as AIChatDialogueRenderActionProps,
    RenderFullDialogueProps as AIChatDialogueRenderFullDialogueProps,
    DialogueRenderConfig,
    Metadata as AIChatDialogueMetadata,
    MarkdownRenderProps as AIChatDialogueMarkdownRenderProps,
    DefaultActionNodeObj as AIChatDialogueDefaultActionNodeObj,
    FullDialogueNodes as AIChatDialogueFullDialogueNodes,
} from './ai-chat-dialogue';
export type { AnnotationItemProps } from './ai-chat-dialogue/widgets/content-item/annotation';
export type { ReasoningWidgetProps } from './ai-chat-dialogue/widgets/content-item/reasoning';
// Foundation types are re-exported from their source module: the d.ts bundler drops types that reach the entry
// through a component module's own re-export of an import
export type { Content as ChatContent, EnableUploadProps as ChatEnableUploadProps } from '@fibrae/semi-ai-foundation/chat/foundation';
export type { Annotation as AIChatDialogueAnnotation, ContentItem as AIChatDialogueContentItem } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
export type {
    MessageContent as AIChatInputMessageContent,
    Content as AIChatInputContent,
    Reference as AIChatInputReference,
    Attachment as AIChatInputAttachment,
    LeftMenuChangeProps as AIChatInputLeftMenuChangeProps,
    Suggestion as AIChatInputSuggestion,
    Setup as AIChatInputSetup,
} from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
export type { StreamingResponseState, ResponseChunk } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/interface';
export type { StreamingChatState } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/streaming-chat-completion-to-message';
export { default as AIChatInput, getConfigureItem } from './ai-chat-input';
export type {
    AIChatInputProps,
    AIChatInputHandle,
    Skill as AIChatInputSkill,
    RenderUploadButtonProps,
    RenderSuggestionItemProps,
    RenderSkillItemProps,
    RenderTopSlotProps as AIChatInputRenderTopSlotProps,
    ActionAreaProps as AIChatInputActionAreaProps,
    PlaceholderProps as AIChatInputPlaceholderProps,
} from './ai-chat-input';
export { chatCompletionToMessage, streamingChatCompletionToMessage, streamingResponseToMessage, responseToMessage, chatInputToMessage, chatInputToChatCompletion } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
export { default as MCPConfigure } from './sidebar/mcp-configure';
export type { MCPConfigureProps } from './sidebar/mcp-configure';
export type { MCPReactOption as MCPConfigureOption } from './sidebar/mcp-configure/content';
export { default as Annotation } from './sidebar/annotation';
export type { AnnotationProps } from './sidebar/annotation';
export type { AnnotationInfo } from './sidebar/annotation/content';
export type { AnnotationItem } from './sidebar/annotation/item';
export { default as Sidebar } from './sidebar';
export type { SideBarProps, Option as SideBarOption, DetailContent as SideBarDetailContent } from './sidebar/interface';
export type { ImageUploadNodeOptions } from './sidebar/widget/image-slot';
export type { CodeItemProps } from './sidebar/widget/code';
export type { FileItemProps } from './sidebar/widget/file';
