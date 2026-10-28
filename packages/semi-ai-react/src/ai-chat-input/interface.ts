import type { ReactNode, ClipboardEvent as ReactClipboardEvent } from 'react';
import type { Editor, Extensions, FocusPosition, Content as TiptapContent } from '@tiptap/core';
import type { BaseSkill, Reference, Suggestion, Attachment, Content, LeftMenuChangeProps, RichTextJSON, MessageContent } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
import type { PopoverProps } from '@fibrae/semi-ui-react/popover/index';
import type { TooltipProps } from '@fibrae/semi-ui-react/tooltip/index';
import type { OnChangeProps, UploadProps } from '@fibrae/semi-ui-react/upload/index';
export type * from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { Node } from '@tiptap/pm/model';

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
    /** null until the editor is created, which is after the first commit when `immediatelyRender` is false */
    getEditor: () => Editor | null;
    setContent: (content: TiptapContent) => void;
    setContentWhileSaveTool: (content: string) => void;
}

export interface AIChatInputProps extends ElementProps<'div'> {
    /** Exposes the methods; the root element is not reachable through it */
    ref?: React.Ref<AIChatInputHandle>;
    dropdownMatchTriggerWidth?: boolean;
    keepSkillAfterSend?: boolean;
    className?: string;
    style?: React.CSSProperties;
    placeholder?: PlaceholderProps;
    /**
     * Whether to show the placeholder when only a skill is selected
     * @default false
     */
    showPlaceholderWhenSkillOnly?: boolean;
    extensions?: Extensions;
    onContentChange?: (contents: Content[]) => void;
    defaultContent?: TiptapContent;
    onFocus?: (event: React.FocusEvent) => void;
    onBlur?: (event: React.FocusEvent) => void;
    /**
     * Called on paste in the editor; does not change default paste behavior.
     */
    onPaste?: (event: ReactClipboardEvent<HTMLDivElement>) => void;
    references?: Reference[];
    renderReference?: (reference: Reference) => ReactNode;
    onReferenceDelete?: (reference: Reference) => void;
    onReferenceClick?: (reference: Reference) => void;
    uploadProps?: Omit<UploadProps, 'fileList' | 'listType'>;
    onUploadChange?: (props: OnChangeProps) => void;
    /**
     * Customizes the footer upload button while keeping the built-in upload and paste-upload logic.
     */
    renderUploadButton?: (props: RenderUploadButtonProps) => ReactNode;
    renderTopSlot?: (props: RenderTopSlotProps) => ReactNode;
    topSlotPosition?: 'top' | 'middle' | 'bottom';
    showUploadFile?: boolean;
    showReference?: boolean;
    showUploadButton?: boolean;
    round?: boolean; // fully rounds the footer operate and configure buttons
    canSend?: boolean; // overrides whether the send button is enabled
    onMessageSend?: (props: MessageContent) => void;
    onStopGenerate?: () => void;
    uploadTipProps?: TooltipProps;
    generating?: boolean;
    renderConfigureArea?: () => ReactNode;
    /** `changedValue` is undefined when an item is removed */
    onConfigureChange?: (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => void;
    renderActionArea?: (props: ActionAreaProps) => ReactNode;
    suggestions?: Suggestion[];
    renderSuggestionItem?: (props: RenderSuggestionItemProps) => ReactNode;
    skills?: Skill[];
    skillHotKey?: string;
    templatesStyle?: React.CSSProperties;
    templatesCls?: string;
    /** `skill` is undefined when the skill is removed */
    onSkillChange?: (skill?: Skill) => void;
    renderSkillItem?: (props: RenderSkillItemProps) => ReactNode;
    /** `skill` is undefined when the template button is shown without a selected skill */
    renderTemplate?: (skill: Skill | undefined, onTemplateClick: (content: string) => void) => ReactNode;
    showTemplateButton?: boolean;
    transformer?: Map<string, (obj: any) => any>;
    popoverProps?: PopoverProps;
    sendHotKey?: 'enter' | 'shift+enter';
    immediatelyRender?: boolean;
    /**
     * Whether to clear the input when `generating` turns true
     * @default true
     */
    clearContentOnGenerating?: boolean;
}

export interface RenderUploadButtonProps {
    /**
     * The default upload button node; wrap or clone it, or return a custom node.
     */
    defaultNode: ReactNode;
    /**
     * Opens the file selector. The Upload wrapper already opens it on click; use this when your node stops propagation.
     */
    openFileDialog: () => void;
    disabled: boolean;
    attachments: Attachment[];
}

export interface RenderSuggestionItemProps {
    suggestion: Suggestion;
    className: string;
    /** Spread onto the item so the editor's `aria-activedescendant` can point at it */
    id: string;
    role: 'option';
    'aria-selected': boolean;
    onClick: () => void;
    onMouseEnter: () => void;
}

export interface RenderSkillItemProps {
    skill: Skill;
    className: string;
    /** Spread onto the item so the editor's `aria-activedescendant` can point at it */
    id: string;
    role: 'option';
    'aria-selected': boolean;
    onClick: () => void;
    onMouseEnter: () => void;
}

export interface Skill extends BaseSkill {
    icon?: ReactNode;
}

export interface ActionAreaProps {
    // In order: the upload button, then the send or stop button
    menuItem: ReactNode[];
    className: string;
}

export interface RenderTopSlotProps {
    references: Reference[];
    attachments: Attachment[];
    content: Content[];
    handleUploadFileDelete: (attachment: Attachment) => void;
    handleReferenceDelete: (reference: Reference) => void;
}
