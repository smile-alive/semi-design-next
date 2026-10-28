import { getCustomSlotAttribute } from '@fibrae/semi-ai-foundation/ai-chat-input/utils';
import AIChatInput from './ai-chat-input.vue';
import Configure from './configure';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
const AIChatInputWithParts: typeof AIChatInput & {
    Configure: typeof Configure;
    getCustomSlotAttribute: typeof getCustomSlotAttribute;
} = Object.assign(AIChatInput, { Configure, getCustomSlotAttribute });
export default AIChatInputWithParts;
export { default as getConfigureItem } from './configure/get-configure-item';
export type {
    AIChatInputProps,
    AIChatInputEmits,
    AIChatInputSlots,
    AIChatInputHandle,
    Skill,
    PlaceholderProps,
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
} from './interface';
export type { ConfigureProps, ConfigureEmits, ConfigureSlots, ConfigureHandle, ConfigureItemOpts, ConfigureItemProps, McpProps, McpEmits, McpSlots, McpOption, McpOptionIconSlotProps } from './configure/interface';
// From the declaring module: the d.ts bundler drops a type re-exported through another module's re-export
export type { Attachment, BaseSkill, Content, LeftMenuChangeProps, MessageContent, Reference, RichTextJSON, Setup, Suggestion } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
