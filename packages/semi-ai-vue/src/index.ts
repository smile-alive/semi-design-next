import './semi-global';

// Types are exported from the interface module that declares them: the d.ts bundler drops types that reach the entry
// through a component module's own re-export of an import
export { default as Chat } from './chat/index';
export type {
    ChatProps,
    ChatEmits,
    ChatSlots,
    ChatHandle,
    ChatMessage,
    ChatContent,
    ChatEnableUploadProps,
    ChatMetadata,
    ChatRoleConfig,
    ChatMarkdownRenderProps,
    ChatUploadProps,
    ChatInputChangeProps,
    ChatDefaultActionNodeObj,
    ChatFullChatBoxNodes,
    ChatTitleSlotProps,
    ChatAvatarSlotProps,
    ChatRoleAvatarSlotProps,
    ChatContentSlotProps,
    ChatActionSlotProps,
    ChatFullChatBoxSlotProps,
    ChatInputAreaSlotProps,
    ChatHintBoxSlotProps,
    ChatDividerSlotProps,
} from './chat/interface';

export { default as AIChatDialogue } from './ai-chat-dialogue/index';
export type {
    AIChatDialogueProps,
    AIChatDialogueEmits,
    AIChatDialogueSlots,
    AIChatDialogueHandle,
    RoleConfig as AIChatDialogueRoleConfig,
    Metadata as AIChatDialogueMetadata,
    MarkdownRenderProps as AIChatDialogueMarkdownRenderProps,
    DefaultActionNodeObj as AIChatDialogueDefaultActionNodeObj,
    FullDialogueNodes as AIChatDialogueFullDialogueNodes,
    MessageInnerItem as AIChatDialogueMessageInnerItem,
    AIChatDialogueTitleSlotProps,
    AIChatDialogueAvatarSlotProps,
    AIChatDialogueContentSlotProps,
    AIChatDialogueActionSlotProps,
    AIChatDialogueFullDialogueSlotProps,
    AIChatDialogueContentItemSlotProps,
    AIChatDialogueMessageTextSlotProps,
    AIChatDialogueHintBoxSlotProps,
    AIChatDialogueMessageEditSlotProps,
    AnnotationItemProps,
    AnnotationWidgetProps,
    AnnotationWidgetEmits,
    ReasoningWidgetProps,
    ReasoningWidgetSlots,
    ReasoningWidgetContentSlotProps,
    DialogueStep,
    DialogueStepAction,
    DialogueStepWidgetProps,
    DialogueStepWidgetSlots,
    DialogueStepWidgetActionIconSlotProps,
} from './ai-chat-dialogue/interface';
export type { Message as AIChatDialogueMessage, Annotation as AIChatDialogueAnnotation, ContentItem as AIChatDialogueContentItem } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';

export { default as AIChatInput, getConfigureItem } from './ai-chat-input/index';
export type {
    AIChatInputProps,
    AIChatInputEmits,
    AIChatInputSlots,
    AIChatInputHandle,
    Skill as AIChatInputSkill,
    PlaceholderProps as AIChatInputPlaceholderProps,
    AIChatInputUploadProps,
    AIChatInputPopoverProps,
    AIChatInputReferenceSlotProps,
    AIChatInputTopSlotProps,
    AIChatInputUploadButtonSlotProps,
    AIChatInputActionAreaSlotProps,
    AIChatInputSuggestionItemSlotProps,
    AIChatInputSkillItemSlotProps,
    AIChatInputSkillIconSlotProps,
    AIChatInputTemplateSlotProps,
} from './ai-chat-input/interface';
export type { ConfigureProps, ConfigureEmits, ConfigureSlots, ConfigureHandle, ConfigureItemOpts, ConfigureItemProps, McpProps, McpEmits, McpSlots, McpOption, McpOptionIconSlotProps } from './ai-chat-input/configure/interface';
export type {
    MessageContent as AIChatInputMessageContent,
    Content as AIChatInputContent,
    Reference as AIChatInputReference,
    Attachment as AIChatInputAttachment,
    LeftMenuChangeProps as AIChatInputLeftMenuChangeProps,
    Suggestion as AIChatInputSuggestion,
    Setup as AIChatInputSetup,
    RichTextJSON as AIChatInputRichTextJSON,
} from '@fibrae/semi-ai-foundation/ai-chat-input/interface';

export type { StreamingResponseState, ResponseChunk } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/interface';
export type { StreamingChatState } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/streaming-chat-completion-to-message';
export { chatCompletionToMessage, streamingChatCompletionToMessage, streamingResponseToMessage, responseToMessage, chatInputToMessage, chatInputToChatCompletion } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';

export { default as MCPConfigure } from './sidebar/mcp-configure/index';
export type { MCPConfigureProps, MCPConfigureEmits, MCPConfigureSlots, MCPConfigureOption, MCPConfigureItemSlotProps } from './sidebar/mcp-configure/interface';

export { default as Annotation } from './sidebar/annotation/index';
export type { AnnotationProps, AnnotationEmits, AnnotationSlots, AnnotationItem, AnnotationInfo, AnnotationHeaderSlotProps, AnnotationItemSlotProps } from './sidebar/annotation/interface';

export { default as Sidebar } from './sidebar/index';
export type { SidebarContainerHandle } from './sidebar/index';
export type { SideBarProps, SideBarEmits, SideBarSlots, SideBarOption, SideBarDetailContent, SideBarOptionSlotProps, SideBarOptionItemSlotProps, SideBarMainContentSlotProps, SideBarDetailHeaderSlotProps, SideBarDetailContentSlotProps } from './sidebar/interface';
export type { CodeItemProps, CodeItemSlots, FileItemProps, FileItemEmits, ImageUploadNodeOptions } from './sidebar/widget/interface';
