import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { Editor, Extensions, FocusPosition, Content as TiptapContent } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import type { Attachment, Content, LeftMenuChangeProps, MessageContent, Reference, Suggestion } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { PopoverProps } from '@fibrae/semi-ui-vue/popover/index';
import type { TooltipProps } from '@fibrae/semi-ui-vue/tooltip/index';
import type { UploadEmits, UploadOnChangeProps, UploadProps } from '@fibrae/semi-ui-vue/upload/index';

export type PlaceholderProps = string | ((props: { editor: Editor; node: Node; pos: number; hasAnchor: boolean }) => string);

/** A skill is data only; its icon goes through the `skillIcon` slot */
export interface Skill {
    value?: string;
    label?: string;
    hasTemplate?: boolean;
    [key: string]: unknown;
}

/**
 * Upload props and listeners without the list AIChatInput owns. `onChange` and `onRemove` are called by AIChatInput
 * itself (its attachment list is custom UI), so they are not bound to Upload.
 */
export type AIChatInputUploadProps = Omit<Partial<UploadProps>, 'fileList' | 'listType'> & {
    [K in Exclude<keyof UploadEmits, 'update:fileList'> as `on${Capitalize<K>}`]?: (...args: UploadEmits[K]) => void;
};

/** `class` and `style` join the panel's own class and width */
export type AIChatInputPopoverProps = PopoverProps & { class?: HTMLAttributes['class']; style?: StyleValue };

export interface AIChatInputHandle {
    changeTemplateVisible: (visible: boolean) => void;
    deleteContent: (content: Content) => void;
    deleteUploadFile: (item: Attachment) => void;
    focusEditor: (pos?: FocusPosition) => void;
    /** null until the editor is created after mounting */
    getEditor: () => Editor | null;
    setContent: (content: TiptapContent) => void;
    setContentWhileSaveTool: (content: string) => void;
}

export interface AIChatInputProps {
    /** Overrides the content and attachment check of the send button */
    canSend?: boolean;
    /** Whether the content and attachments are cleared when `generating` turns on */
    clearContentOnGenerating?: boolean;
    /** Read once, when the editor is created */
    defaultContent?: TiptapContent;
    dropdownMatchTriggerWidth?: boolean;
    /** Read once, when the editor is created */
    extensions?: Extensions;
    generating?: boolean;
    keepSkillAfterSend?: boolean;
    placeholder?: PlaceholderProps;
    popoverProps?: AIChatInputPopoverProps;
    references?: Reference[];
    /** Full round footer buttons */
    round?: boolean;
    sendHotKey?: 'enter' | 'shift+enter';
    /** Read once, when the editor is created */
    showPlaceholderWhenSkillOnly?: boolean;
    showReference?: boolean;
    showTemplateButton?: boolean;
    showUploadButton?: boolean;
    showUploadFile?: boolean;
    skillHotKey?: string;
    skills?: Skill[];
    suggestions?: Suggestion[];
    templatesCls?: string;
    templatesStyle?: StyleValue;
    topSlotPosition?: 'top' | 'middle' | 'bottom';
    transformer?: Map<string, (obj: any) => any>;
    /** The tip text goes through the `uploadTip` slot */
    uploadTipProps?: Omit<TooltipProps, 'content'>;
    uploadProps?: AIChatInputUploadProps;
}

export interface AIChatInputEmits {
    blur: [event: FocusEvent];
    /** `changedValue` is undefined when an item is removed */
    configureChange: [value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps];
    contentChange: [contents: Content[]];
    focus: [event: FocusEvent];
    messageSend: [message: MessageContent];
    /** The paste event on the editor; it does not change the default paste behavior */
    paste: [event: ClipboardEvent];
    referenceClick: [reference: Reference];
    referenceDelete: [reference: Reference];
    skillChange: [skill: Skill | undefined];
    stopGenerate: [];
    uploadChange: [props: UploadOnChangeProps];
}

export interface AIChatInputReferenceSlotProps {
    item: Reference;
    index: number;
}

export interface AIChatInputTopSlotProps {
    references: Reference[];
    attachments: Attachment[];
    content: Content[];
    onUploadFileDelete: (attachment: Attachment) => void;
    onReferenceDelete: (reference: Reference) => void;
}

export interface AIChatInputUploadButtonSlotProps {
    /** The built-in trigger content */
    defaultNode: VNode;
    /** Upload opens the dialog on click already; for content that stops the click from reaching it */
    onOpenFileDialog: () => void;
    disabled: boolean;
    attachments: Attachment[];
}

export interface AIChatInputActionAreaSlotProps {
    /** The upload trigger (when shown) and the send or stop button, in that order */
    menuItem: VNode[];
    class: string;
}

interface OptionSlotProps {
    class: HTMLAttributes['class'];
    /** Bound onto the item so the editor's `aria-activedescendant` can point at it */
    id: string;
    role: 'option';
    'aria-selected': boolean;
    onClick: () => void;
    onMouseenter: () => void;
}

export interface AIChatInputSuggestionItemSlotProps extends OptionSlotProps {
    suggestion: Suggestion;
}

export interface AIChatInputSkillItemSlotProps extends OptionSlotProps {
    skill: Skill;
}

export interface AIChatInputSkillIconSlotProps {
    item: Skill;
    index: number;
}

export interface AIChatInputTemplateSlotProps {
    skill: Skill | undefined;
    /** Replaces the editor content */
    onTemplateClick: (content: string) => void;
}

export interface AIChatInputSlots {
    /** Replaces each reference */
    reference?: (props: AIChatInputReferenceSlotProps) => VNode[];
    /** Placed by `topSlotPosition` */
    topSlot?: (props: AIChatInputTopSlotProps) => VNode[];
    /** Replaces the upload trigger content; Upload keeps handling clicks and pasted files */
    uploadButton?: (props: AIChatInputUploadButtonSlotProps) => VNode[];
    /** The upload tooltip content */
    uploadTip?: () => VNode[];
    /** Configure items (`AIChatInput.Configure.*`) */
    configureArea?: () => VNode[];
    /** Replaces the action area */
    actionArea?: (props: AIChatInputActionAreaSlotProps) => VNode[];
    /** Replaces each suggestion; bind the option attributes onto its root */
    suggestionItem?: (props: AIChatInputSuggestionItemSlotProps) => VNode[];
    /** Replaces each skill; bind the option attributes onto its root */
    skillItem?: (props: AIChatInputSkillItemSlotProps) => VNode[];
    /** The icon before each skill in the skill panel */
    skillIcon?: (props: AIChatInputSkillIconSlotProps) => VNode[];
    /** The template panel content */
    template?: (props: AIChatInputTemplateSlotProps) => VNode[];
}
