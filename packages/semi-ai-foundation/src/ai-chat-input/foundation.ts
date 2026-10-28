import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { centerInScroller } from '@fibrae/semi-foundation/utils/dom';
import { isComposing } from '@fibrae/semi-foundation/utils/key-code';
import { cssClasses, strings } from './constants';
import type { Attachment, BaseSkill, Suggestion, Reference, Content, LeftMenuChangeProps, MessageContent, RichTextJSON } from './interface';
import { findSkillSlot, getSkillSlotString, transformJSONResult } from './utils';

/** The props the foundation reads with getProps */
export interface AIChatInputBaseProps {
    uploadProps?: {
        disabled?: boolean;
        beforeRemove?: (file: Attachment, fileList: Attachment[]) => boolean | Promise<boolean>;
    };
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

/** The state the foundation reads and writes */
export interface AIChatInputBaseState {
    templateVisible: boolean;
    skillVisible: boolean;
    suggestionVisible: boolean;
    attachments?: Attachment[];
    skill?: BaseSkill;
    activeSkillIndex?: number;
    activeSuggestionIndex?: number;
    content?: RichTextJSON;
}

export interface AIChatInputAdapter<P extends AIChatInputBaseProps = AIChatInputBaseProps, S extends AIChatInputBaseState = AIChatInputBaseState> extends DefaultAdapter<P, S> {
    setContent: (content: string) => void;
    focusEditor: (pos?: any) => void;
    getEditor: () => any;
    /** The option element at `index` of the open skill or suggestion list */
    getOptionNode: (kind: 'skill' | 'suggestion', index: number) => HTMLElement | null;
    notifyContentChange: (result: Content[]) => void;
    /** Writes the transformed content without notifying `onContentChange` */
    setTransformedContent: (result: Content[]) => void;
    getActiveElement: () => Element | null;
    /** `changedValue` is undefined when an item is removed */
    notifyConfigureChange: (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => void;
    manualUpload: (files: File[]) => void;
    notifyMessageSend: (props: MessageContent) => void;
    notifyStopGenerate: () => void;
    /** `skill` is undefined when the skill is removed */
    notifySkillChange: (skill?: BaseSkill) => void;
    clearContent: () => void;
    clearAttachments: () => void;
    getRichTextDiv: () => HTMLDivElement | null;
    notifyReferenceClick: (reference: Reference) => void;
    notifyFocus: (event: any) => void;
    notifyBlur: (event: any) => void;
    notifyUploadChange: (props: any) => void;
    /** The `onChange` of `uploadProps` */
    notifyUploadPropsChange: (props: any) => void;
    notifyUploadRemove: (file: File, fileList: Attachment[], fileItem: Attachment) => void;
    getConfigureValue: () => any;
}

export default class AIChatInputFoundation<P extends AIChatInputBaseProps = AIChatInputBaseProps, S extends AIChatInputBaseState = AIChatInputBaseState> extends BaseFoundation<AIChatInputAdapter<P, S>, P, S> {
    #mouseDownTarget: HTMLElement | null = null;

    #updateScrollTop(kind: 'skill' | 'suggestion', index: number) {
        const destNode = this._adapter.getOptionNode(kind, index);
        if (destNode) {
            centerInScroller(destNode, destNode.parentNode as HTMLElement);
        }
    }

    protected canSend() {
        const { attachments } = this.getStates();
        const editor = this._adapter.getEditor();
        return AIChatInputFoundation.getCanSend(this.getProp('canSend'), editor?.getJSON?.(), attachments);
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

    override init() {}

    handleSkillSelect = (skill: BaseSkill) => {
        this.setState({
            skill: skill,
            skillVisible: false,
        });
        this._adapter.notifySkillChange(skill);
        this._adapter.setContent(getSkillSlotString(skill));
        this._adapter.focusEditor();
    };

    changeTemplateVisible = (value: boolean) => {
        this.setState({ templateVisible: value });
    };

    handlePaste = (files: File[]) => {
        // Upload.insert ignores `disabled`, so a pasted file would be uploaded and could not be removed again
        if (this.getProps().uploadProps?.disabled) {
            return;
        }
        this._adapter.manualUpload(files);
    };

    handleSuggestionSelect = (suggestion: Suggestion) => {
        this._adapter.setContent(typeof suggestion === 'string' ? suggestion : suggestion.content);
        this._adapter.focusEditor();
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

        const beforeRemove = uploadProps?.beforeRemove;
        Promise.resolve(beforeRemove?.(attachment, attachments) ?? true)
            .then((res) => {
                if (res === false) {
                    return;
                }

                const newAttachments = attachments.slice();
                newAttachments.splice(index, 1);

                // After sending, onMessageSend handed the url to the owner, so only unsent attachments are revoked
                const { url, fileInstance } = attachment;
                if (typeof url === 'string' && url.startsWith('blob:') && fileInstance instanceof File) {
                    URL.revokeObjectURL(url);
                }

                this._adapter.notifyUploadRemove(attachment.fileInstance, newAttachments, attachment);

                this.onUploadChange({
                    currentFile: attachment,
                    fileList: newAttachments,
                });
            })
            .catch(() => {
                // a rejected beforeRemove cancels the removal
            });
    };

    handleReferenceClick(reference: Reference) {
        this._adapter.notifyReferenceClick(reference);
    }

    setActiveSuggestionIndex = (index: number) => {
        this.setState({ activeSuggestionIndex: index });
    };

    setActiveSkillIndex = (index: number) => {
        this.setState({ activeSkillIndex: index });
    };

    handleKeyDown = (e: { key: string; preventDefault: () => void; isComposing?: boolean; nativeEvent?: { isComposing?: boolean } }) => {
        // The Enter that commits a composition, or an arrow that picks a candidate, is not a panel key
        if (isComposing(e)) {
            return;
        }
        const { skills, suggestions, skillHotKey } = this.getProps();
        const { skillVisible, suggestionVisible } = this.getStates();
        const editor = this._adapter.getEditor();
        const oldValue = editor?.getText();
        const { activeSkillIndex, activeSuggestionIndex } = this.getStates();
        if (oldValue === '' && e.key === skillHotKey && skills && skills.length) {
            this.setState({ skillVisible: true, activeSkillIndex: 0 });
        } else if ((oldValue === skillHotKey || oldValue?.length === 0) && e.key === 'Backspace') {
            this.setState({ skillVisible: false });
        } else if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
            // Same condition as handleRichTextAreaKeyDown, so the highlight Enter selects always moves
            if (skillVisible && skills?.length) {
                const newIndex = (activeSkillIndex + (e.key === 'ArrowUp' ? -1 : 1) + skills.length) % skills.length;
                this.setActiveSkillIndex(newIndex);
                this.#updateScrollTop('skill', newIndex);
            } else if (suggestionVisible && suggestions?.length) {
                const newIndex = (activeSuggestionIndex + (e.key === 'ArrowUp' ? -1 : 1) + suggestions.length) % suggestions.length;
                this.setActiveSuggestionIndex(newIndex);
                this.#updateScrollTop('suggestion', newIndex);
            }
        } else if (e.key === 'Enter') {
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
        } else if (e.key === 'Escape') {
            // Claiming the key when a panel closes keeps an enclosing dialog open
            if (skillVisible || suggestionVisible) {
                e.preventDefault();
            }
            if (skillVisible) {
                this.setState({ skillVisible: false });
            }
            if (suggestionVisible) {
                this.hideSuggestionPanel();
            }
        }
    };

    onConfigureChange = (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => {
        this._adapter.notifyConfigureChange(value, changedValue);
    };

    showSuggestionPanel() {
        // The list may be shorter than the previous index, so the highlight starts over (APG combobox)
        this.setState({ suggestionVisible: true, activeSuggestionIndex: 0 });
    }

    hideSuggestionPanel = () => {
        this.setState({ suggestionVisible: false });
    };

    /** Escape and a press outside close whichever panel is open; a custom-trigger Popover does neither itself */
    hidePanels = () => {
        this.setState({ templateVisible: false, skillVisible: false, suggestionVisible: false });
    };

    handleCreate = () => {
        const json = this._adapter.getEditor()?.getJSON();
        // A default content that normalizes without a transaction never reaches handleContentChange
        this._adapter.setTransformedContent(transformJSONResult(json, this.getProps().transformer));
        this.setState({ content: json });
    };

    handleContentChange = (_content: string) => {
        const { transformer } = this.getProps();
        const { skill } = this.getStates();
        const editor = this._adapter.getEditor();
        const jsonResult = editor.getJSON();
        const slotSkill = findSkillSlot(jsonResult);
        if (skill && !slotSkill) {
            this.setState({ skill: undefined, templateVisible: false });
            this._adapter.notifySkillChange(undefined);
        } else if (slotSkill && slotSkill.value !== skill?.value) {
            this.setState({ skill: slotSkill });
            this._adapter.notifySkillChange(slotSkill);
        }
        const finalResult = transformJSONResult(jsonResult, transformer);
        this._adapter.notifyContentChange(finalResult);
        this.setState({
            content: jsonResult,
        });
    };

    onUploadChange = (props: any) => {
        const { fileList } = props;
        this._adapter.notifyUploadChange(props);
        this._adapter.notifyUploadPropsChange(props);
        this.setState({
            attachments: fileList,
        });
    };

    setContentWhileSaveTool(content: string) {
        const { skill } = this.getStates();
        this._adapter.setContent(skill ? `<p>${getSkillSlotString(skill)}${content}</p>` : `<p>${content}</p>`);
    }

    handleGeneratingStart() {
        const { keepSkillAfterSend, clearContentOnGenerating } = this.getProps();
        if (clearContentOnGenerating === false) {
            return;
        }
        if (keepSkillAfterSend) {
            this.setContentWhileSaveTool('');
        } else {
            this._adapter.clearContent();
        }
        this._adapter.clearAttachments();
    }

    handleStopGenerate = () => {
        const { generating } = this.getProps();
        if (generating) {
            this._adapter.notifyStopGenerate();
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
        const editor = this._adapter.getEditor();
        let richTextResult = [];
        if (editor) {
            const json = editor.getJSON?.();
            richTextResult = transformJSONResult(json, transformer);
        }
        this.setState({
            templateVisible: false,
            skillVisible: false,
            suggestionVisible: false,
        });
        this._adapter.notifyMessageSend({
            references,
            attachments,
            inputContents: richTextResult,
            setup: this._adapter.getConfigureValue() ?? {},
        });
    };

    handleContainerMouseDown = (e: any) => {
        this.#mouseDownTarget = e.target as HTMLElement;
    };

    handleContainerClick = (e: any) => {
        const target = e.target;
        if (this.#mouseDownTarget && this.#mouseDownTarget !== e.target) {
            // A drag-selection released outside the editor must not refocus it, which would lose the selection
            return;
        }
        const richTextDiv = this._adapter.getRichTextDiv();
        if (richTextDiv && (richTextDiv === target || richTextDiv.contains(target as Node))) {
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
        const active = this._adapter.getActiveElement();
        if (active?.closest(`.${cssClasses.PREFIX}-footer-configure`)) {
            return;
        }
        this._adapter.focusEditor();
    };

    handleRichTextAreaKeyDown = (view: any, event: KeyboardEvent) => {
        if (view.composing) {
            return false;
        }
        const { sendHotKey } = this.getProps();
        const { suggestionVisible, skillVisible } = this.getStates();
        if ((suggestionVisible || skillVisible) && ['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
            return true;
        }
        const editor = this._adapter.getEditor() ?? {};
        const allowHotKeySend = editor.storage?.SemiAIChatInput?.allowHotKeySend;
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
            const editor = this._adapter.getEditor();
            if (editor && editor.chain && editor.chain().splitBlock) {
                editor.chain().focus().splitBlock().run();
            } else if (editor && editor.view) {
                const { state, view } = editor;
                view.dispatch(state.tr.split(state.selection.from));
            }
            return true;
        }
        return false;
    };

    handleDeleteContent({ uniqueKey }: Content) {
        const editor = this._adapter.getEditor();
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
    }

    handleFocus = (event: any) => {
        this._adapter.notifyFocus(event);
    };

    handleBlur = (event: any) => {
        this._adapter.notifyBlur(event);
    };
}
