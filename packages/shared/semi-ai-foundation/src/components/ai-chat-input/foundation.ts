import type { Content as TiptapContent, FocusPosition } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import { isEqual } from 'es-toolkit';
import FocusTrapHandle from '@fibrae/semi-foundation/base/focus-handle';
import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { removeUnlessPrevented } from '@fibrae/semi-foundation/components/upload/utils';
import { centerInScroller } from '@fibrae/semi-foundation/utils/dom';
import { isComposing } from '@fibrae/semi-foundation/utils/key-code';
import { cssClasses, strings } from './constants';
import { handleZeroWidthCharLogic } from './extension/plugins';
import type { Attachment, BaseSkill, Suggestion, Reference, Content, LeftMenuChangeProps, MessageContent, RichTextJSON } from './interface';
import { findSkillSlot, getSkillSlotString, transformJSONResult } from './utils';

export interface AIChatInputBaseProps {
    uploadProps?: {
        disabled?: boolean;
        defaultFileList?: Attachment[];
    };
    /** Read by the placeholder extension; a change only redraws it */
    placeholder?: unknown;
    skills?: BaseSkill[];
    suggestions?: Suggestion[];
    skillHotKey?: string;
    sendHotKey?: 'enter' | 'shift+enter';
    transformer?: Map<string, (obj: any) => any>;
    keepSkillAfterSend?: boolean;
    clearContentOnGenerating?: boolean;
    generating?: boolean;
    canSend?: boolean;
    references?: Reference[];
}

export interface AIChatInputState {
    templateVisible: boolean;
    skillVisible: boolean;
    suggestionVisible: boolean;
    attachments: Attachment[];
    skill: BaseSkill | undefined;
    activeSkillIndex: number;
    activeSuggestionIndex: number;
    /** The editor JSON; undefined until the editor has created it */
    content: RichTextJSON | undefined;
}

export interface AIChatInputAdapter<P extends AIChatInputBaseProps = AIChatInputBaseProps> extends DefaultAdapter<P, AIChatInputState> {
    /** The tiptap editor the framework created; null before it exists */
    getEditor: () => any;
    getOptionNode: (kind: 'skill' | 'suggestion', index: number) => HTMLElement | null;
    notifyContentChange: (result: Content[]) => void;
    /** `changedValue` is undefined when an item is removed */
    notifyConfigureChange: (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => void;
    manualUpload: (files: File[]) => void;
    notifyMessageSend: (props: MessageContent) => void;
    notifyStopGenerate: () => void;
    /** `skill` is undefined when the skill is removed */
    notifySkillChange: (skill?: BaseSkill) => void;
    getRichTextDiv: () => HTMLDivElement | null;
    notifyReferenceClick: (reference: Reference) => void;
    notifyFocus: (event: any) => void;
    notifyBlur: (event: any) => void;
    notifyUploadChange: (props: any) => void;
    /** The `onChange` of `uploadProps` */
    notifyUploadPropsChange: (props: any) => void;
    /** The `beforeRemove` of `uploadProps`, returned as is */
    notifyBeforeRemove: (file: Attachment, fileList: Attachment[]) => unknown;
    notifyUploadRemove: (file: File, fileList: Attachment[], fileItem: Attachment) => void;
    getConfigureValue: () => any;
}

export default class AIChatInputFoundation<P extends AIChatInputBaseProps = AIChatInputBaseProps> extends BaseFoundation<AIChatInputAdapter<P>, P, AIChatInputState> {
    #mouseDownTarget: EventTarget | null = null;

    static override readonly propKeys = ['suggestions', 'generating', 'placeholder'];
    // callers often pass a new array with the same items
    static override readonly propEquals = { suggestions: isEqual };

    #updateScrollTop(kind: 'skill' | 'suggestion', index: number) {
        const destNode = this.adapter.getOptionNode(kind, index);
        if (destNode) {
            centerInScroller(destNode, destNode.parentNode as HTMLElement);
        }
    }

    /** Send and line-break keys; true claims the key from ProseMirror */
    #handleEditorKey(event: KeyboardEvent) {
        const { sendHotKey } = this.getProps();
        const { suggestionVisible, skillVisible } = this.getStates();
        if ((suggestionVisible || skillVisible) && ['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
            return true;
        }
        const editor = this.adapter.getEditor();
        const allowHotKeySend = editor.storage[strings.STATUS_EXTENSION_NAME]?.allowHotKeySend;
        if (event.key === 'Enter' && (sendHotKey === strings.SEND_HOTKEY.ENTER ? !event.shiftKey : event.shiftKey) && allowHotKeySend) {
            this.handleSend();
            return true;
        }
        if (event.key === 'Enter' && (sendHotKey === strings.SEND_HOTKEY.ENTER ? event.shiftKey : !event.shiftKey)) {
            // With shift+enter as the send key a plain Enter is the extension's own key once it has cleared allowHotKeySend
            if (sendHotKey !== strings.SEND_HOTKEY.ENTER && !allowHotKeySend) {
                return false;
            }
            // A new <p> instead of Tiptap's <br /> keeps the zero-width character logic working
            event.preventDefault();
            editor.chain().focus().splitBlock().run();
            return true;
        }
        return false;
    }

    /** Opens, moves through, picks from and closes the skill and suggestion panels; reads the text before the key applies */
    #handlePanelKey(event: KeyboardEvent) {
        const { skills, suggestions, skillHotKey } = this.getProps();
        const { skillVisible, suggestionVisible, activeSkillIndex, activeSuggestionIndex } = this.getStates();
        const oldValue = this.adapter.getEditor()?.getText();
        if (oldValue === '' && event.key === skillHotKey && skills && skills.length) {
            this.setState({ skillVisible: true, activeSkillIndex: 0 });
        } else if ((oldValue === skillHotKey || oldValue?.length === 0) && event.key === 'Backspace') {
            this.setState({ skillVisible: false });
        } else if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
            // Same condition as #handleEditorKey, so the highlight Enter selects always moves
            if (skillVisible && skills?.length) {
                const newIndex = (activeSkillIndex + (event.key === 'ArrowUp' ? -1 : 1) + skills.length) % skills.length;
                this.setActiveSkillIndex(newIndex);
                this.#updateScrollTop('skill', newIndex);
            } else if (suggestionVisible && suggestions?.length) {
                const newIndex = (activeSuggestionIndex + (event.key === 'ArrowUp' ? -1 : 1) + suggestions.length) % suggestions.length;
                this.setActiveSuggestionIndex(newIndex);
                this.#updateScrollTop('suggestion', newIndex);
            }
        } else if (event.key === 'Enter') {
            if (skillVisible) {
                this.setState({ skillVisible: false });
                const newSkill = skills[activeSkillIndex];
                if (newSkill) {
                    this.handleSkillSelect(newSkill);
                }
            } else if (suggestionVisible) {
                const newSuggestion = suggestions[activeSuggestionIndex];
                this.handleSuggestionSelect(newSuggestion);
                this.hideSuggestionPanel();
            }
        } else if (event.key === 'Escape') {
            // Claiming the key when a panel closes keeps an enclosing dialog open
            if (skillVisible || suggestionVisible) {
                event.preventDefault();
            }
            if (skillVisible) {
                this.setState({ skillVisible: false });
            }
            if (suggestionVisible) {
                this.hideSuggestionPanel();
            }
        }
    }

    protected canSend() {
        const { attachments } = this.getStates();
        const editor = this.adapter.getEditor();
        return AIChatInputFoundation.getCanSend(this.getProp('canSend'), editor?.getJSON(), attachments);
    }

    /**
     * Whether the send button is enabled: the `canSend` prop when given, otherwise rich text or attachments present.
     * `content` is the editor JSON, undefined before the editor exists.
     */
    static getCanSend(canSend: boolean | undefined, content: RichTextJSON | undefined, attachments: Attachment[]) {
        if (canSend !== undefined) {
            return canSend;
        }
        // An empty paragraph has no `content`; a leading blank line must not hide the paragraphs after it
        const validRichText = Boolean(content) && content.content.some((node) => node.content !== undefined);
        const validAttachment = Array.isArray(attachments) && attachments.length > 0;
        return validRichText || validAttachment;
    }

    /** The `content` of the top slot: the editor JSON in the form `onContentChange` reports, empty before the editor exists */
    static getTransformedContent(content: RichTextJSON | undefined, transformer?: Map<string, (obj: any) => any>): Content[] {
        return content ? transformJSONResult(content, transformer) : [];
    }

    static getInitialState(props: AIChatInputBaseProps): AIChatInputState {
        return {
            templateVisible: false,
            skillVisible: false,
            suggestionVisible: false,
            attachments: props.uploadProps?.defaultFileList ?? [],
            skill: undefined,
            activeSkillIndex: 0,
            activeSuggestionIndex: 0,
            content: undefined,
        };
    }

    override handlePropsChange(prev: Partial<P>) {
        const { suggestions, generating } = this.getProps();
        if (!isEqual(prev.suggestions, suggestions)) {
            if (suggestions && suggestions.length > 0) {
                this.showSuggestionPanel();
            } else {
                this.hideSuggestionPanel();
            }
        }
        if (generating && prev.generating !== generating) {
            this.handleGeneratingStart();
        }
        const editor = this.adapter.getEditor();
        if (prev.placeholder !== this.getProp('placeholder') && editor && !editor.isDestroyed) {
            // the extension reads the placeholder when it draws; an empty transaction makes it draw again
            editor.view.dispatch(editor.state.tr);
        }
    }

    setContent = (content: TiptapContent) => {
        this.adapter.getEditor()?.commands.setContent(content);
    };

    // null and false are tiptap positions (keep the selection, do nothing), so only undefined falls back
    focusEditor = (pos?: FocusPosition) => {
        this.adapter.getEditor()?.commands.focus(pos ?? 'end');
    };

    handleSkillSelect = (skill: BaseSkill) => {
        this.setState({
            skill: skill,
            skillVisible: false,
        });
        this.adapter.notifySkillChange(skill);
        this.setContent(getSkillSlotString(skill));
        this.focusEditor();
    };

    changeTemplateVisible = (value: boolean) => {
        this.setState({ templateVisible: value });
    };

    handlePaste = (files: File[]) => {
        // Upload.insert ignores `disabled`, so a pasted file would be uploaded and could not be removed again
        if (this.getProps().uploadProps?.disabled) {
            return;
        }
        this.adapter.manualUpload(files);
    };

    handleSuggestionSelect = (suggestion: Suggestion) => {
        this.setContent(typeof suggestion === 'string' ? suggestion : suggestion.content);
        this.focusEditor();
    };

    // The upload list is custom UI, so removal mirrors Upload: beforeRemove, then onRemove, then onUploadChange
    handleUploadFileDelete = (attachment: Attachment) => {
        const { uploadProps } = this.getProps();
        const { attachments: attachmentsFromState } = this.getStates();
        const attachments = Array.isArray(attachmentsFromState) ? attachmentsFromState : [];

        if (uploadProps?.disabled) {
            return;
        }

        const index = attachments.findIndex((item) => item.uid === attachment.uid);
        if (index < 0) {
            return;
        }

        removeUnlessPrevented(this.adapter.notifyBeforeRemove(attachment, attachments), () => {
            const newAttachments = attachments.slice();
            newAttachments.splice(index, 1);

            // After sending, onMessageSend handed the url to the owner, so only unsent attachments are revoked
            const { url, fileInstance } = attachment;
            if (typeof url === 'string' && url.startsWith('blob:') && fileInstance instanceof File) {
                URL.revokeObjectURL(url);
            }

            this.adapter.notifyUploadRemove(attachment.fileInstance, newAttachments, attachment);

            this.onUploadChange({
                currentFile: attachment,
                fileList: newAttachments,
            });
        });
    };

    handleReferenceClick = (reference: Reference) => {
        this.adapter.notifyReferenceClick(reference);
    };

    setActiveSuggestionIndex = (index: number) => {
        this.setState({ activeSuggestionIndex: index });
    };

    setActiveSkillIndex = (index: number) => {
        this.setState({ activeSkillIndex: index });
    };

    /**
     * The editor's `editorProps.handleKeyDown`. ProseMirror skips it during composition and for keys from controls
     * inside slot node views; `isComposing` also covers the keydown that starts a composition.
     */
    handleKeyDown = (view: EditorView, event: KeyboardEvent) => {
        if (view.composing || isComposing(event)) {
            return false;
        }
        // Editor keys first: picking a panel item on Enter closes the panel, and that Enter must not then send
        const handled = this.#handleEditorKey(event);
        this.#handlePanelKey(event);
        return handled;
    };

    onConfigureChange = (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => {
        this.adapter.notifyConfigureChange(value, changedValue);
    };

    showSuggestionPanel = () => {
        // The list may be shorter than the previous index, so the highlight starts over (APG combobox)
        this.setState({ suggestionVisible: true, activeSuggestionIndex: 0 });
    };

    hideSuggestionPanel = () => {
        this.setState({ suggestionVisible: false });
    };

    /** Escape and a press outside close whichever panel is open; a custom-trigger Popover does neither itself */
    hidePanels = () => {
        this.setState({ templateVisible: false, skillVisible: false, suggestionVisible: false });
    };

    /**
     * Called once `getEditor` returns a new editor, before anything else dispatches on it. The normalizing dispatch here
     * runs the editor's update handler synchronously, which reads the editor through `getEditor`.
     */
    handleCreate = () => {
        const editor = this.adapter.getEditor();
        const tr = handleZeroWidthCharLogic(editor.state);
        if (tr) {
            editor.view.dispatch(tr);
        }
        // A default content that normalizes without a transaction never reaches handleContentChange
        this.setState({ content: editor.getJSON() });
    };

    handleContentChange = (_content: string) => {
        const { transformer } = this.getProps();
        const { skill } = this.getStates();
        const editor = this.adapter.getEditor();
        const jsonResult = editor.getJSON();
        const slotSkill = findSkillSlot(jsonResult);
        if (skill && !slotSkill) {
            this.setState({ skill: undefined, templateVisible: false });
            this.adapter.notifySkillChange(undefined);
        } else if (slotSkill && slotSkill.value !== skill?.value) {
            this.setState({ skill: slotSkill });
            this.adapter.notifySkillChange(slotSkill);
        }
        const finalResult = transformJSONResult(jsonResult, transformer);
        this.adapter.notifyContentChange(finalResult);
        this.setState({
            content: jsonResult,
        });
    };

    onUploadChange = (props: any) => {
        const { fileList } = props;
        this.adapter.notifyUploadChange(props);
        this.adapter.notifyUploadPropsChange(props);
        this.setState({
            attachments: fileList,
        });
    };

    setContentWhileSaveTool = (content: string) => {
        const { skill } = this.getStates();
        this.setContent(skill ? `<p>${getSkillSlotString(skill)}${content}</p>` : `<p>${content}</p>`);
    };

    handleGeneratingStart = () => {
        const { keepSkillAfterSend, clearContentOnGenerating } = this.getProps();
        if (clearContentOnGenerating === false) {
            return;
        }
        if (keepSkillAfterSend) {
            this.setContentWhileSaveTool('');
        } else {
            this.setContent('');
        }
        this.setState({ attachments: [] });
    };

    handleStopGenerate = () => {
        const { generating } = this.getProps();
        if (generating) {
            this.adapter.notifyStopGenerate();
        }
    };

    handleSend = () => {
        const { generating, transformer } = this.getProps();
        if (generating) {
            return;
        }
        if (!this.canSend()) {
            return;
        }
        const references = this.getProp('references');
        const { attachments } = this.getStates();
        const editor = this.adapter.getEditor();
        let richTextResult = [];
        if (editor) {
            richTextResult = transformJSONResult(editor.getJSON(), transformer);
        }
        this.setState({
            templateVisible: false,
            skillVisible: false,
            suggestionVisible: false,
        });
        this.adapter.notifyMessageSend({
            references,
            attachments,
            inputContents: richTextResult,
            setup: this.adapter.getConfigureValue() ?? {},
        });
    };

    handleContainerMouseDown = (e: { target: EventTarget | null }) => {
        this.#mouseDownTarget = e.target;
    };

    handleContainerClick = (e: { target: EventTarget | null; detail: number }) => {
        const target = e.target;
        if (this.#mouseDownTarget && this.#mouseDownTarget !== e.target) {
            // A drag-selection released outside the editor must not refocus it, which would lose the selection
            return;
        }
        const richTextDiv = this.adapter.getRichTextDiv();
        if (richTextDiv && (richTextDiv === target || (target instanceof Node && richTextDiv.contains(target)))) {
            const { suggestions } = this.getProps();
            if (suggestions && suggestions.length > 0) {
                this.showSuggestionPanel();
            }
            return;
        }
        // Keyboard-triggered clicks (detail 0) must not pull focus away from the control being operated
        if (e.detail === 0) {
            return;
        }
        // A control that took focus on mousedown (a Configure.Select) keeps it, or its open list would lose the keyboard
        const active = FocusTrapHandle.getActiveElement(this.adapter.getRichTextDiv());
        if (active?.closest(`.${cssClasses.FOOTER_CONFIGURE}`)) {
            return;
        }
        this.focusEditor();
    };

    handleDeleteContent = ({ uniqueKey }: Content) => {
        const editor = this.adapter.getEditor();
        // Nodes without the attribute also read undefined
        if (!editor || uniqueKey === undefined) return;

        editor.commands.command(({ tr, state }) => {
            let found = false;
            state.doc.descendants((node, pos) => {
                if (node.attrs.uniqueKey === uniqueKey) {
                    tr.delete(pos, pos + node.nodeSize);
                    found = true;
                    return false;
                }
                return true;
            });
            return found;
        });
    };

    handleFocus = (event: unknown) => {
        this.adapter.notifyFocus(event);
    };

    handleBlur = (event: unknown) => {
        this.adapter.notifyBlur(event);
    };
}
