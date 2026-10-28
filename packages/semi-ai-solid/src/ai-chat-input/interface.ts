import type { JSX, Ref } from 'solid-js';
import type { Editor, Extensions, FocusPosition, Content as TiptapContent } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import type { Attachment, Content, LeftMenuChangeProps, MessageContent, Reference, RichTextJSON, Suggestion } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import type { PopoverProps } from '@fibrae/semi-ui-solid/popover/index';
import type { TooltipProps } from '@fibrae/semi-ui-solid/tooltip/index';
import type { OnChangeProps, UploadProps } from '@fibrae/semi-ui-solid/upload/index';

export type * from '@fibrae/semi-ai-foundation/ai-chat-input/interface';

export interface AIChatInputState {
    templateVisible: boolean;
    skillVisible: boolean;
    suggestionVisible: boolean;
    attachments?: Attachment[];
    skill?: Skill;
    activeSkillIndex?: number;
    activeSuggestionIndex?: number;
    content?: RichTextJSON;
}

export type PlaceholderProps = string | ((props: { editor: Editor; node: Node; pos: number; hasAnchor: boolean }) => string);

export interface AIChatInputHandle {
    changeTemplateVisible: (visible: boolean) => void;
    deleteContent: (content: Content) => void;
    deleteUploadFile: (item: Attachment) => void;
    focusEditor: (pos?: FocusPosition) => void;
    /** null until the editor is created when the component mounts */
    getEditor: () => Editor | null;
    setContent: (content: TiptapContent) => void;
    setContentWhileSaveTool: (content: string) => void;
}

export type AIChatInputElement = HTMLDivElement & AIChatInputHandle;

export interface AIChatInputProps extends ElementProps<'div', 'onFocus' | 'onBlur' | 'onPaste' | 'placeholder' | 'ref' | 'children'> {
    /** The root element with the AIChatInputHandle methods */
    ref?: Ref<AIChatInputElement>;
    dropdownMatchTriggerWidth?: boolean;
    keepSkillAfterSend?: boolean;
    placeholder?: PlaceholderProps;
    /**
     * Whether to show the placeholder when only a skill is selected; read when the editor is created
     * @default false
     */
    showPlaceholderWhenSkillOnly?: boolean;
    /** Read when the editor is created */
    extensions?: Extensions;
    onContentChange?: (contents: Content[]) => void;
    /** Read when the editor is created */
    defaultContent?: TiptapContent;
    /** `focusin` on the editor area */
    onFocus?: (event: FocusEvent) => void;
    /** `focusout` on the editor area */
    onBlur?: (event: FocusEvent) => void;
    /**
     * Called on paste in the editor; does not change default paste behavior.
     */
    onPaste?: (event: ClipboardEvent) => void;
    references?: Reference[];
    renderReference?: (reference: Reference) => JSX.Element;
    onReferenceDelete?: (reference: Reference) => void;
    onReferenceClick?: (reference: Reference) => void;
    uploadProps?: Omit<UploadProps, 'fileList' | 'listType'>;
    onUploadChange?: (props: OnChangeProps) => void;
    /**
     * Customizes the footer upload button while keeping the built-in upload and paste-upload logic.
     */
    renderUploadButton?: (props: RenderUploadButtonProps) => JSX.Element;
    renderTopSlot?: (props: RenderTopSlotProps) => JSX.Element;
    topSlotPosition?: 'top' | 'middle' | 'bottom';
    showUploadFile?: boolean;
    showReference?: boolean;
    showUploadButton?: boolean;
    /** Fully rounds the footer operate and configure buttons */
    round?: boolean;
    /** Overrides whether the send button is enabled */
    canSend?: boolean;
    onMessageSend?: (props: MessageContent) => void;
    onStopGenerate?: () => void;
    /** The tip goes on the default upload button; with `renderUploadButton` or `uploadProps.children` it wraps the custom node in a span */
    uploadTipProps?: TooltipProps;
    generating?: boolean;
    renderConfigureArea?: () => JSX.Element;
    /** `changedValue` is undefined when an item is removed */
    onConfigureChange?: (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => void;
    renderActionArea?: (props: ActionAreaProps) => JSX.Element;
    suggestions?: Suggestion[];
    renderSuggestionItem?: (props: RenderSuggestionItemProps) => JSX.Element;
    skills?: Skill[];
    skillHotKey?: string;
    /** Merged over the default max height, so only an object */
    templatesStyle?: JSX.CSSProperties;
    templatesCls?: string;
    /** `skill` is undefined when the skill is removed */
    onSkillChange?: (skill?: Skill) => void;
    /** The icon before each skill in the skill panel */
    renderSkillIcon?: (skill: Skill) => JSX.Element;
    renderSkillItem?: (props: RenderSkillItemProps) => JSX.Element;
    /** `skill` is undefined when the template button is shown without a selected skill */
    renderTemplate?: (skill: Skill | undefined, onTemplateClick: (content: string) => void) => JSX.Element;
    showTemplateButton?: boolean;
    transformer?: Map<string, (obj: any) => any>;
    popoverProps?: PopoverProps;
    sendHotKey?: 'enter' | 'shift+enter';
    /**
     * Whether to clear the input when `generating` turns true
     * @default true
     */
    clearContentOnGenerating?: boolean;
}

/** The getters are live; the function is called once */
export interface RenderUploadButtonProps {
    /**
     * Creates the default upload button; call it where the button is inserted in the returned node, or return a custom
     * node instead and the button is never created.
     */
    defaultNode: () => JSX.Element;
    /**
     * Opens the file selector. The Upload wrapper already opens it on click; use this when your node stops propagation.
     */
    openFileDialog: () => void;
    disabled: boolean;
    attachments: Attachment[];
}

/** Spread onto the item so the editor's `aria-activedescendant` can point at it; the getters are live */
export interface RenderSuggestionItemProps {
    suggestion: Suggestion;
    class: string;
    id: string;
    role: 'option';
    'aria-selected': boolean;
    onClick: () => void;
    onMouseEnter: () => void;
}

/** Spread onto the item so the editor's `aria-activedescendant` can point at it; the getters are live */
export interface RenderSkillItemProps {
    skill: Skill;
    class: string;
    id: string;
    role: 'option';
    'aria-selected': boolean;
    onClick: () => void;
    onMouseEnter: () => void;
}

/** A skill is data only; its icon comes from `renderSkillIcon` */
export interface Skill {
    value?: string;
    label?: string;
    hasTemplate?: boolean;
    [key: string]: unknown;
}

export interface ActionAreaProps {
    /** In order: the upload button, then the send or stop button */
    menuItem: JSX.Element[];
    class: string;
}

/** The getters are live; the function is called once */
export interface RenderTopSlotProps {
    references: Reference[];
    attachments: Attachment[];
    content: Content[];
    handleUploadFileDelete: (attachment: Attachment) => void;
    handleReferenceDelete: (reference: Reference) => void;
}
