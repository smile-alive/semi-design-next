import './semi-global.js';

// Types are exported from the interface module that declares them: the d.ts bundler drops types that reach the entry
// through a component module's own re-export of an import
export { AIChatDialogue } from './ai-chat-dialogue/index.js';
export type {
    AIChatDialogueProps,
    RoleConfig as AIChatDialogueRoleConfig,
    Metadata as AIChatDialogueMetadata,
    MarkdownRenderProps as AIChatDialogueMarkdownRenderProps,
    DefaultActionNodeObj as AIChatDialogueDefaultActionNodeObj,
    FullDialogueNodes as AIChatDialogueFullDialogueNodes,
    MessageInnerItem as AIChatDialogueMessageInnerItem,
    AIChatDialogueTitleSnippetProps,
    AIChatDialogueAvatarSnippetProps,
    AIChatDialogueContentSnippetProps,
    AIChatDialogueActionSnippetProps,
    AIChatDialogueFullDialogueSnippetProps,
    AIChatDialogueContentItemSnippetProps,
    AIChatDialogueMessageTextSnippetProps,
    AIChatDialogueHintBoxSnippetProps,
    AIChatDialogueMessageEditSnippetProps,
    AnnotationItemProps,
    AnnotationWidgetProps,
    ReasoningPart,
    ReasoningWidgetProps,
    ReasoningWidgetContentSnippetProps,
    DialogueStep,
    DialogueStepAction,
    DialogueStepWidgetProps,
    DialogueStepWidgetActionIconSnippetProps,
} from './ai-chat-dialogue/interface.js';
export type { Message as AIChatDialogueMessage, Annotation as AIChatDialogueAnnotation, ContentItem as AIChatDialogueContentItem } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';

export { AIChatInput } from './ai-chat-input/index.js';
export type {
    AIChatInputProps,
    AIChatInputHandle,
    AIChatInputUploadProps,
    AIChatInputPopoverProps,
    PlaceholderProps as AIChatInputPlaceholderProps,
    Skill as AIChatInputSkill,
    AIChatInputReferenceSnippetProps,
    AIChatInputTopSlotSnippetProps,
    AIChatInputUploadButtonSnippetProps,
    AIChatInputActionAreaSnippetProps,
    AIChatInputSuggestionItemSnippetProps,
    AIChatInputSkillItemSnippetProps,
    AIChatInputSkillIconSnippetProps,
    AIChatInputTemplateSnippetProps,
} from './ai-chat-input/interface.js';
export type {
    ConfigureProps as AIChatInputConfigureProps,
    ConfigureHandle as AIChatInputConfigureHandle,
    ConfigureItemOwnProps as AIChatInputConfigureItemOwnProps,
    ConfigureSelectProps as AIChatInputConfigureSelectProps,
    ConfigureRadioButtonProps as AIChatInputConfigureRadioButtonProps,
    ConfigureButtonProps as AIChatInputConfigureButtonProps,
    McpOption as AIChatInputMcpOption,
    McpOptionIconSnippetProps as AIChatInputMcpOptionIconSnippetProps,
    McpProps as AIChatInputMcpProps,
} from './ai-chat-input/configure/interface.js';
export type {
    Attachment as AIChatInputAttachment,
    BaseSkill as AIChatInputBaseSkill,
    Content as AIChatInputContent,
    LeftMenuChangeProps as AIChatInputLeftMenuChangeProps,
    MessageContent as AIChatInputMessageContent,
    Reference as AIChatInputReference,
    RichTextJSON as AIChatInputRichTextJSON,
    Setup as AIChatInputSetup,
    Suggestion as AIChatInputSuggestion,
} from '@fibrae/semi-ai-foundation/ai-chat-input/interface';

export { Chat } from './chat/index.js';
export type {
    ChatProps,
    ChatHandle,
    ChatMessage,
    ChatContent,
    ChatAlign,
    ChatMode,
    SendHotKey as ChatSendHotKey,
    ChatEnableUploadProps,
    ChatMetadata,
    ChatRoleConfig,
    ChatMarkdownRenderProps,
    ChatUploadProps,
    ChatInputChangeProps,
    ChatDefaultActionNodeObj,
    ChatFullChatBoxNodes,
    ChatTitleSnippetProps,
    ChatAvatarSnippetProps,
    ChatRoleAvatarSnippetProps,
    ChatContentSnippetProps,
    ChatActionSnippetProps,
    ChatFullChatBoxSnippetProps,
    ChatInputAreaSnippetProps,
    ChatHintBoxSnippetProps,
    ChatDividerSnippetProps,
} from './chat/interface.js';

export { Sidebar, Annotation, MCPConfigure } from './sidebar/index.js';
export type { ContainerHandle as SidebarContainerHandle, ContainerProps as SidebarContainerProps } from './sidebar/container/interface.js';
export type { SideBarProps, SideBarOption, SideBarDetailContent, SideBarOptionSnippetProps, SideBarOptionItemSnippetProps, SideBarMainContentSnippetProps, SideBarDetailHeaderSnippetProps, SideBarDetailBodySnippetProps } from './sidebar/interface.js';
export type { CodeItemProps, CodeContentProps, FileItemProps, FileContentProps, ImageUploadNodeOptions } from './sidebar/widget/interface.js';
export type { AnnotationProps, AnnotationContentProps, AnnotationItem, AnnotationInfo, AnnotationHeaderSnippetProps, AnnotationItemSnippetProps } from './sidebar/annotation/interface.js';
export type { MCPConfigureProps, MCPConfigureContentProps, MCPConfigureOption, MCPConfigureItemSnippetProps } from './sidebar/mcp-configure/interface.js';

export type { StreamingResponseState, ResponseChunk } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/interface';
export type { StreamingChatState } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/streaming-chat-completion-to-message';
export { chatCompletionToMessage, streamingChatCompletionToMessage, streamingResponseToMessage, responseToMessage, chatInputToMessage, chatInputToChatCompletion } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
