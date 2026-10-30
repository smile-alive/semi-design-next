import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { Editor, Extensions, FocusPosition, Content as TiptapContent } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import type { Attachment, Content, LeftMenuChangeProps, MessageContent, Reference, Suggestion } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { PopoverProps } from '@fibrae/semi-ui-svelte/popover/index';
import type { TooltipProps } from '@fibrae/semi-ui-svelte/tooltip/index';
import type { FileItem, UploadOnChangeProps, UploadProps } from '@fibrae/semi-ui-svelte/upload/index';

export type PlaceholderProps = string | ((props: { editor: Editor; node: Node; pos: number; hasAnchor: boolean }) => string);

/** A skill is data only; its icon goes through the `skillIcon` snippet */
export interface Skill {
    value?: string;
    label?: string;
    hasTemplate?: boolean;
    [key: string]: unknown;
}

/**
 * Upload props without the list AIChatInput owns. `onChange` and `onRemove` are called by AIChatInput itself (its
 * attachment list is custom UI), so they are not bound to Upload. `defaultFileList` seeds the attachments once.
 */
export type AIChatInputUploadProps = Omit<Partial<UploadProps>, 'fileList' | 'listType' | 'children'> & {
    defaultFileList?: FileItem[];
};

/** The panel's own class and width are added to `class` and `style` */
export type AIChatInputPopoverProps = Omit<PopoverProps, 'children' | 'child' | 'content' | 'visible' | 'trigger' | 'role' | 'disableArrowKeyDown'>;

export interface AIChatInputHandle {
    changeTemplateVisible: (visible: boolean) => void;
    deleteContent: (content: Content) => void;
    deleteUploadFile: (item: Attachment) => void;
    focusEditor: (pos?: FocusPosition) => void;
    /** undefined until the editor is created after mounting */
    getEditor: () => Editor | undefined;
    setContent: (content: TiptapContent) => void;
    setContentWhileSaveTool: (content: string) => void;
}

export interface AIChatInputReferenceSnippetProps {
    item: Reference;
    index: number;
}

export interface AIChatInputTopSlotSnippetProps {
    references: Reference[];
    attachments: Attachment[];
    content: Content[];
    onUploadFileDelete: (attachment: Attachment) => void;
    onReferenceDelete: (reference: Reference) => void;
}

export interface AIChatInputUploadButtonSnippetProps {
    /** The built-in trigger content */
    defaultNode: Snippet;
    /** Upload opens the dialog on click already; for content that stops the click from reaching it */
    onOpenFileDialog: () => void;
    disabled: boolean;
    attachments: Attachment[];
}

export interface AIChatInputActionAreaSnippetProps {
    /** The upload trigger, which stays mounted (hidden when `showUploadButton` is off): paste upload goes through it */
    upload: Snippet;
    /** The send or stop button */
    send: Snippet;
    class: string;
}

interface OptionSnippetProps {
    class: ClassValue;
    /** Bound onto the item so the editor's `aria-activedescendant` can point at it */
    id: string;
    role: 'option';
    'aria-selected': boolean;
    onclick: () => void;
    onmouseenter: () => void;
}

export interface AIChatInputSuggestionItemSnippetProps extends OptionSnippetProps {
    suggestion: Suggestion;
}

export interface AIChatInputSkillItemSnippetProps extends OptionSnippetProps {
    skill: Skill;
}

export interface AIChatInputSkillIconSnippetProps {
    item: Skill;
    index: number;
}

export interface AIChatInputTemplateSnippetProps {
    skill?: Skill;
    /** Replaces the editor content */
    onTemplateClick: (content: string) => void;
}

// What the root div takes natively; the lowercase listeners that share a meaning with a callback below give way to it
type NativeKeys = 'children' | 'placeholder' | 'onfocus' | 'onblur' | 'onpaste';

export interface AIChatInputProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeKeys> {
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
    templatesStyle?: string;
    topSlotPosition?: 'top' | 'middle' | 'bottom';
    transformer?: Map<string, (obj: any) => any>;
    /** The tip text goes through the `uploadTip` snippet */
    uploadTipProps?: Omit<TooltipProps, 'content' | 'children' | 'child' | 'arrow'>;
    uploadProps?: AIChatInputUploadProps;
    /** `changedValue` is undefined when an item is removed */
    onConfigureChange?: (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => void;
    onContentChange?: (contents: Content[]) => void;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onMessageSend?: (message: MessageContent) => void;
    /** The paste event on the editor; it does not change the default paste behavior */
    onPaste?: (event: ClipboardEvent) => void;
    onReferenceClick?: (reference: Reference) => void;
    onReferenceDelete?: (reference: Reference) => void;
    onSkillChange?: (skill?: Skill) => void;
    onStopGenerate?: () => void;
    onUploadChange?: (props: UploadOnChangeProps) => void;
    /** Replaces each reference */
    reference?: Snippet<[AIChatInputReferenceSnippetProps]>;
    /** Placed by `topSlotPosition` */
    topSlot?: Snippet<[AIChatInputTopSlotSnippetProps]>;
    /** Replaces the upload trigger content; Upload keeps handling clicks and pasted files */
    uploadButton?: Snippet<[AIChatInputUploadButtonSnippetProps]>;
    /** The upload tooltip content */
    uploadTip?: Snippet;
    /** Configure items (`AIChatInput.Configure.*`) */
    configureArea?: Snippet;
    /** Replaces the action area */
    actionArea?: Snippet<[AIChatInputActionAreaSnippetProps]>;
    /** Replaces each suggestion; spread the option props onto its root */
    suggestionItem?: Snippet<[AIChatInputSuggestionItemSnippetProps]>;
    /** Replaces each skill; spread the option props onto its root */
    skillItem?: Snippet<[AIChatInputSkillItemSnippetProps]>;
    /** The icon before each skill in the skill panel */
    skillIcon?: Snippet<[AIChatInputSkillIconSnippetProps]>;
    /** The template panel content */
    template?: Snippet<[AIChatInputTemplateSnippetProps]>;
}
