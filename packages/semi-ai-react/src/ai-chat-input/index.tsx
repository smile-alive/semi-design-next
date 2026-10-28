import { Fragment, useCallback, useId, useImperativeHandle, useRef, useState } from 'react';
import type { Editor, FocusPosition, Content as TiptapContent } from '@tiptap/core';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, numbers, strings } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import AIChatInputFoundation, { type AIChatInputAdapter } from '@fibrae/semi-ai-foundation/ai-chat-input/foundation';
import { getAttachmentType, getContentType, getCustomSlotAttribute, getListbox, getOptionId } from '@fibrae/semi-ai-foundation/ai-chat-input/utils';
import { isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
import { isUploadProgressVisible } from '@fibrae/semi-ai-foundation/upload-status';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-ai-foundation/ai-chat-input/ai-chat-input.scss';
import { type IconSize, IconSendMsgStroked, IconFile, IconCode, IconCrossStroked, IconPaperclip, IconArrowUp, IconStop, IconClose, IconTemplateStroked, IconMusic, IconVideo, IconPdf, IconWord, IconExcel } from '@fibrae/semi-icons-react';
import { namedRole } from '@fibrae/semi-ui-react/_base/named-role';
import useDefaultProps from '@fibrae/semi-ui-react/_base/use-default-props';
import useFoundation from '@fibrae/semi-ui-react/_base/use-foundation';
import Button from '@fibrae/semi-ui-react/button/index';
import { useConfigContext } from '@fibrae/semi-ui-react/config-provider/context';
import { useDidUpdate, useFocusHandover, useLocale, useMergedRef } from '@fibrae/semi-ui-react/hooks';
import Popover from '@fibrae/semi-ui-react/popover/index';
import Progress from '@fibrae/semi-ui-react/progress/index';
import Tooltip from '@fibrae/semi-ui-react/tooltip/index';
import Upload, { type UploadHandle, type UploadProps } from '@fibrae/semi-ui-react/upload/index';
import Configure, { type ConfigureHandle } from './configure';
import HorizontalScroller from './horizontal-scroller';
import type { AIChatInputProps, AIChatInputState, Skill, Attachment, Reference, Content, RenderUploadButtonProps } from './interface';
import RichTextInput from './rich-text-input';
import SkillItem from './skill-item';
import SuggestionItem from './suggestion-item';

export { default as getConfigureItem } from './configure/get-configure-item';
export * from './interface';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    onContentChange: noop,
    onStopGenerate: noop,
    showReference: true,
    showUploadFile: true,
    generating: false,
    dropdownMatchTriggerWidth: true,
    round: true,
    topSlotPosition: 'top',
    sendHotKey: strings.SEND_HOTKEY.ENTER,
    keepSkillAfterSend: false,
    showUploadButton: true,
    clearContentOnGenerating: true,
    // tiptap creates no editor on the server and warns when this is true; false creates it after mount on both sides
    immediatelyRender: false,
} satisfies Partial<AIChatInputProps>;

const hiddenStyle = { display: 'none' } as const;

// Editor and Upload handle for the adapter and ref methods; a class because the Compiler rejects passing a
// ref-reading function (openFileDialog) into a call made during render
class AIChatInputRuntime {
    editor: Editor | null = null;
    upload: UploadHandle | null = null;

    setEditor(editor: Editor) {
        this.editor = editor;
    }

    setUpload(upload: UploadHandle | null) {
        this.upload = upload;
    }

    getEditorDom = () => this.editor?.view.dom;

    openFileDialog = () => {
        this.upload?.openFileDialog?.();
    };

    setContent = (content: TiptapContent) => {
        this.editor?.commands.setContent(content);
    };

    // null and false are tiptap positions (keep the selection, do nothing), so only undefined falls back
    focus = (pos?: FocusPosition) => {
        this.editor?.commands.focus(pos ?? 'end');
    };
}

function getIconByType(type: string, size: IconSize = 'small') {
    switch (type) {
        case 'text':
            return null;
        case 'file':
        case 'word':
            return <IconWord size={size} />;
        case 'code':
            return <IconCode size={size} />;
        case 'excel':
            return <IconExcel size={size} />;
        case 'video':
            return <IconVideo size={size} />;
        case 'audio':
            return <IconMusic size={size} />;
        case 'pdf':
            return <IconPdf size={size} />;
        default:
            return <IconFile size={size} />;
    }
}

function AIChatInput(rawProps: AIChatInputProps) {
    const props = useDefaultProps('AIChatInput', rawProps, defaultProps);

    const {
        ref,
        dropdownMatchTriggerWidth,
        keepSkillAfterSend,
        className,
        style,
        placeholder,
        showPlaceholderWhenSkillOnly,
        extensions,
        onContentChange,
        defaultContent,
        onFocus,
        onBlur,
        onPaste,
        references,
        renderReference,
        onReferenceDelete,
        onReferenceClick,
        uploadProps,
        onUploadChange,
        renderUploadButton,
        renderTopSlot,
        topSlotPosition,
        showUploadFile,
        showReference,
        showUploadButton,
        round,
        canSend,
        onMessageSend,
        onStopGenerate,
        uploadTipProps,
        generating,
        renderConfigureArea,
        onConfigureChange,
        renderActionArea,
        suggestions,
        renderSuggestionItem,
        skills,
        skillHotKey,
        templatesStyle,
        templatesCls,
        onSkillChange,
        renderSkillItem,
        renderTemplate,
        showTemplateButton,
        transformer,
        popoverProps,
        sendHotKey,
        immediatelyRender,
        clearContentOnGenerating,
        ...rest
    } = props;

    const { direction } = useConfigContext();
    const { locale } = useLocale('AIChatInput');

    const [runtime] = useState(() => new AIChatInputRuntime());
    const popupId = useId();
    const triggerRef = useRef<HTMLDivElement>(null);
    const richTextRef = useRef<HTMLDivElement>(null);
    const skillPanelRef = useRef<HTMLDivElement>(null);
    const suggestionPanelRef = useRef<HTMLDivElement>(null);
    const configureRef = useRef<ConfigureHandle>(null);
    const [transformedContent, setTransformedContent] = useState<Content[]>([]);

    const [foundation, state] = useFoundation<AIChatInputFoundation<AIChatInputProps, AIChatInputState>, AIChatInputAdapter<AIChatInputProps, AIChatInputState>, AIChatInputProps, AIChatInputState>(
        AIChatInputFoundation,
        props,
        () => ({
            templateVisible: false,
            skillVisible: false,
            suggestionVisible: false,
            attachments: props.uploadProps?.defaultFileList ?? [],
            content: null,
            skill: undefined,
            activeSkillIndex: 0,
            activeSuggestionIndex: 0,
        }),
        (base) => ({
            setContent: runtime.setContent,
            clearContent: () => runtime.setContent(''),
            clearAttachments: () => base.setState({ attachments: [] }),
            focusEditor: runtime.focus,
            getEditor: () => runtime.editor,
            // the panel may render in a shadow root, out of reach of document queries
            getOptionNode: (kind, index) => ((kind === 'skill' ? skillPanelRef : suggestionPanelRef).current?.children[index] as HTMLElement | undefined) ?? null,
            notifySkillChange: (skill?: Skill) => base.getProps().onSkillChange?.(skill),
            notifyContentChange: (result) => {
                setTransformedContent(result);
                base.getProps().onContentChange?.(result);
            },
            setTransformedContent,
            getActiveElement: () => (triggerRef.current?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement ?? null,
            notifyConfigureChange: (value, changedValue) => base.getProps().onConfigureChange?.(value, changedValue),
            manualUpload: (files) => runtime.upload?.insert(files),
            notifyMessageSend: (message) => base.getProps().onMessageSend?.(message),
            notifyStopGenerate: () => base.getProps().onStopGenerate?.(),
            getRichTextDiv: () => richTextRef.current,
            notifyReferenceClick: (reference) => base.getProps().onReferenceClick?.(reference),
            notifyFocus: (event) => base.getProps().onFocus?.(event),
            notifyBlur: (event) => base.getProps().onBlur?.(event),
            notifyUploadChange: (props) => base.getProps().onUploadChange?.(props),
            notifyUploadPropsChange: (props) => base.getProps().uploadProps?.onChange?.(props),
            notifyUploadRemove: (file, fileList, fileItem) => base.getProps().uploadProps?.onRemove?.(file, fileList, fileItem),
            getConfigureValue: () => configureRef.current?.getConfigureValue(),
        })
    );

    // a delete button leaves with its item while it holds focus; the editor is where typing continues
    const handoverToEditor = useFocusHandover<HTMLButtonElement>(runtime.getEditorDom);

    const editorId = `${prefixCls}-editor-${popupId}`;
    const skillListId = `${prefixCls}-skill-${popupId}`;
    const suggestionListId = `${prefixCls}-suggestion-${popupId}`;
    const { templateVisible, skillVisible, suggestionVisible, skill, attachments, activeSkillIndex, activeSuggestionIndex } = state;
    const listbox = getListbox(state, { skills, suggestions }, { skillListId, suggestionListId });

    const topSlot = renderTopSlot?.({
        references: references ?? [],
        attachments,
        content: transformedContent,
        handleUploadFileDelete: foundation.handleUploadFileDelete,
        handleReferenceDelete: (reference: Reference) => onReferenceDelete?.(reference),
    });

    const { hasTemplate } = skill ?? {};

    const configureNode = (
        <div className={`${prefixCls}-footer-configure`}>
            <Configure ref={configureRef} onChange={foundation.onConfigureChange}>
                {renderConfigureArea?.()}
            </Configure>
            {/* not a Configure item: templateVisible also changes on send and skill removal */}
            {(showTemplateButton || hasTemplate) && (
                <Button
                    type="tertiary"
                    className={clsx(`${prefixCls}-footer-configure-button`, {
                        [`${prefixCls}-footer-configure-button-active`]: templateVisible,
                    })}
                    aria-pressed={templateVisible}
                    theme="outline"
                    icon={<IconTemplateStroked />}
                    onClick={() => foundation.changeTemplateVisible(!templateVisible)}
                >
                    {locale.template}
                </Button>
            )}
        </div>
    );

    const sendEnabled = AIChatInputFoundation.getCanSend(canSend, state.content, attachments);

    const sendNode = (
        <button
            key="send"
            type="button"
            className={clsx(`${prefixCls}-footer-action-button`, {
                [`${prefixCls}-footer-action-send`]: !generating,
                [`${prefixCls}-footer-action-stop`]: generating,
                [`${prefixCls}-footer-action-send-disabled`]: !generating && !sendEnabled,
            })}
            // not disabled: keeps focus, and handleSend already ignores the click
            aria-disabled={!generating && !sendEnabled ? 'true' : undefined}
            aria-label={generating ? locale.stop : locale.send}
            onClick={generating ? foundation.handleStopGenerate : foundation.handleSend}
        >
            {generating ? <IconStop /> : <IconArrowUp />}
        </button>
    );

    const actionCls = `${prefixCls}-footer-action`;

    const setUpload = useCallback((upload: UploadHandle | null) => runtime.setUpload(upload), [runtime]);

    const uploadRef = useMergedRef(setUpload, uploadProps?.ref);

    const setEditor = useCallback((editor: Editor) => runtime.setEditor(editor), [runtime]);

    const renderPopoverContent = () => {
        if (templateVisible) {
            return (
                <div className={clsx(`${prefixCls}-template`, { [templatesCls]: templatesCls })} style={{ maxHeight: numbers.TEMPLATE_MAX_HEIGHT, ...templatesStyle }}>
                    {renderTemplate?.(skill, runtime.setContent)}
                </div>
            );
        }
        if (skillVisible) {
            return (
                <div ref={skillPanelRef} id={skillListId} className={`${prefixCls}-skill`} style={{ maxHeight: numbers.SKILL_MAX_HEIGHT }} aria-labelledby={editorId} role="listbox">
                    {skills?.map((item, index) => (
                        // value is optional and may repeat; the list is replaced as a whole
                        <SkillItem key={index} id={getOptionId(skillListId, index)} index={index} isActive={activeSkillIndex === index} skill={item} renderSkillItem={renderSkillItem} onClick={foundation.handleSkillSelect} onMouseEnter={foundation.setActiveSkillIndex} />
                    ))}
                </div>
            );
        }
        if (suggestionVisible) {
            return (
                <div ref={suggestionPanelRef} id={suggestionListId} className={`${prefixCls}-suggestion`} style={{ maxHeight: numbers.SUGGESTION_MAX_HEIGHT }} aria-labelledby={editorId} role="listbox">
                    {suggestions?.map((item, index) => (
                        <SuggestionItem
                            // suggestions may repeat and carry no id; the list is replaced as a whole
                            key={index}
                            id={getOptionId(suggestionListId, index)}
                            index={index}
                            isActive={activeSuggestionIndex === index}
                            suggestion={item}
                            renderSuggestionItem={renderSuggestionItem}
                            onClick={foundation.handleSuggestionSelect}
                            onMouseEnter={foundation.setActiveSuggestionIndex}
                        />
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderReferences = () => {
        if (!references?.length) {
            return null;
        }
        return (
            <div className={`${prefixCls}-references`}>
                {references.map((item) => {
                    if (renderReference) {
                        return <Fragment key={item.id}>{renderReference(item)}</Fragment>;
                    }
                    const { id, type, content, name, url } = item;
                    const signIconType = getContentType(getAttachmentType(item));
                    return (
                        <div key={id} className={`${prefixCls}-reference`}>
                            <IconSendMsgStroked />
                            <button type="button" className={`${prefixCls}-reference-content`} onClick={() => foundation.handleReferenceClick(item)}>
                                {type !== 'text' && (isImageFile(item.name, item.fileInstance?.type) ? <img className={`${prefixCls}-reference-img`} alt="" src={url} /> : <span className={`${prefixCls}-ref-icon ${prefixCls}-ref-icon-${signIconType} ${prefixCls}-reference-icon`}>{getIconByType(signIconType)}</span>)}
                                <span className={`${prefixCls}-reference-name`}>{type === 'text' ? content : name}</span>
                            </button>
                            <button
                                ref={handoverToEditor}
                                type="button"
                                className={`${prefixCls}-reference-delete`}
                                aria-label={locale.removeReference}
                                onClick={(e) => {
                                    onReferenceDelete?.(item);
                                    e.stopPropagation();
                                }}
                            >
                                <IconCrossStroked size="small" />
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderAttachments = () => {
        if (!attachments?.length) {
            return null;
        }
        return (
            <HorizontalScroller prefix={`${prefixCls}`}>
                {attachments.map((item: Attachment) => {
                    const realType = getAttachmentType(item);
                    const signIconType = getContentType(realType);
                    const { uid, name, url, size, percent } = item;
                    return (
                        <div key={uid} className={`${prefixCls}-attachment`}>
                            {isImageFile(name, item.fileInstance?.type) ? <img className={`${prefixCls}-attachment-img`} alt="" src={url} /> : <span className={`${prefixCls}-attachment-icon ${prefixCls}-ref-icon ${prefixCls}-ref-icon-${signIconType}`}>{getIconByType(signIconType, 'large')}</span>}
                            <div className={`${prefixCls}-attachment-content`}>
                                <div className={`${prefixCls}-attachment-content-name`}>{name}</div>
                                <div className={`${prefixCls}-attachment-content-size`}>{`${realType} ${size}`}</div>
                            </div>
                            {isUploadProgressVisible(item) && <Progress type="circle" className={`${prefixCls}-attachment-progress`} aria-label={locale.uploadProgress} percent={percent} showInfo={false} width={30} />}
                            <button ref={handoverToEditor} type="button" className={`${prefixCls}-attachment-delete`} aria-label={locale.removeAttachment} disabled={uploadProps?.disabled} onClick={() => foundation.handleUploadFileDelete(item)}>
                                <IconClose size="small" />
                            </button>
                        </div>
                    );
                })}
            </HorizontalScroller>
        );
    };

    const renderUploadNode = () => {
        const { children, ...uploadRest } = uploadProps ?? ({} as UploadProps);
        const renderProps: RenderUploadButtonProps = {
            defaultNode: children ?? (
                // Upload's add area yields its role and tab stop to this button; aria-disabled keeps it focusable so
                // the upload tip reaches the keyboard
                <button type="button" className={`${prefixCls}-footer-action-button ${prefixCls}-footer-action-upload`} aria-disabled={uploadProps?.disabled ? 'true' : undefined} aria-label={locale.upload}>
                    <IconPaperclip />
                </button>
            ),
            openFileDialog: runtime.openFileDialog,
            disabled: Boolean(uploadProps?.disabled),
            attachments: attachments ?? [],
        };
        if (!showUploadButton) {
            // Paste upload goes through this Upload, so it stays mounted without a trigger
            return <Upload {...uploadRest} key="upload" ref={uploadRef} style={hiddenStyle} fileList={attachments} listType="none" onChange={foundation.onUploadChange} />;
        }
        const trigger = renderUploadButton ? renderUploadButton(renderProps) : renderProps.defaultNode;
        return (
            <Upload {...uploadRest} key="upload" ref={uploadRef} fileList={attachments} listType="none" onChange={foundation.onUploadChange}>
                {/* the tooltip wraps the focus target, so aria-describedby lands on it and no Tab stop is added */}
                {uploadTipProps ? <Tooltip {...uploadTipProps}>{trigger}</Tooltip> : trigger}
            </Upload>
        );
    };

    const actionNode = [renderUploadNode(), sendNode];

    // compared deeply: callers often pass a new array with the same items
    useDidUpdate(
        suggestions,
        (current) => {
            if (current && current.length > 0) {
                foundation.showSuggestionPanel();
            } else {
                foundation.hideSuggestionPanel();
            }
        },
        isEqual
    );

    useDidUpdate(generating, (isGenerating) => {
        if (isGenerating) {
            foundation.handleGeneratingStart();
        }
    });

    useImperativeHandle(
        ref,
        () => ({
            changeTemplateVisible: (visible) => foundation.changeTemplateVisible(visible),
            deleteContent: (content) => foundation.handleDeleteContent(content),
            deleteUploadFile: (item) => foundation.handleUploadFileDelete(item),
            focusEditor: runtime.focus,
            getEditor: () => runtime.editor,
            setContent: runtime.setContent,
            setContentWhileSaveTool: (content) => foundation.setContentWhileSaveTool(content),
        }),
        [foundation, runtime]
    );

    return (
        <Popover
            position={direction === 'rtl' ? 'bottomRight' : 'bottomLeft'}
            {...popoverProps}
            className={clsx(popoverProps?.className, {
                [`${prefixCls}-popover-suggestion`]: suggestionVisible,
                [`${prefixCls}-popover-skill`]: skillVisible,
                [`${prefixCls}-popover-template`]: templateVisible,
            })}
            // the Tooltip updates the variable whenever the trigger resizes, also while open
            style={dropdownMatchTriggerWidth ? { width: 'var(--semi-tooltip-trigger-width)', ...popoverProps?.style } : popoverProps?.style}
            // the lists are driven by the textbox, not a dialog that takes focus
            role="presentation"
            content={renderPopoverContent()}
            disableArrowKeyDown
            trigger="custom"
            visible={templateVisible || skillVisible || suggestionVisible}
            // a custom-trigger popup claims Escape and ignores outside presses, so the panels close here
            onClickOutSide={(e) => {
                popoverProps?.onClickOutSide?.(e);
                foundation.hidePanels();
            }}
            onEscKeyDown={(e) => {
                popoverProps?.onEscKeyDown?.(e);
                foundation.hidePanels();
            }}
        >
            <div
                role={namedRole(rest)}
                {...rest}
                ref={triggerRef}
                className={clsx(prefixCls, { [className]: className })}
                style={style}
                // the textbox is the Tab stop; Tooltip would add tabIndex 0 here
                tabIndex={-1}
                onClick={(e) => {
                    rest.onClick?.(e);
                    foundation.handleContainerClick(e);
                }}
                onMouseDown={(e) => {
                    rest.onMouseDown?.(e);
                    foundation.handleContainerMouseDown(e);
                }}
            >
                {topSlotPosition === 'top' && topSlot}
                {showReference && renderReferences()}
                {topSlotPosition === 'middle' && topSlot}
                {showUploadFile && renderAttachments()}
                {topSlotPosition === 'bottom' && topSlot}
                <RichTextInput
                    id={editorId}
                    placeholder={placeholder}
                    activeDescendant={listbox?.activeId}
                    controls={listbox?.id}
                    defaultContent={defaultContent}
                    extensions={extensions}
                    innerRef={richTextRef}
                    setEditor={setEditor}
                    showPlaceholderWhenSkillOnly={showPlaceholderWhenSkillOnly}
                    immediatelyRender={immediatelyRender}
                    handleCreate={foundation.handleCreate}
                    handleKeyDown={foundation.handleRichTextAreaKeyDown}
                    onBlur={foundation.handleBlur}
                    onChange={foundation.handleContentChange}
                    onFocus={foundation.handleFocus}
                    onKeyDown={foundation.handleKeyDown}
                    onPaste={foundation.handlePaste}
                    onPasteEvent={onPaste}
                />
                <div className={clsx(`${prefixCls}-footer`, { [`${prefixCls}-footer-round`]: round })}>
                    {configureNode}
                    {renderActionArea ? renderActionArea({ menuItem: actionNode, className: actionCls }) : <div className={actionCls}>{actionNode}</div>}
                </div>
            </div>
        </Popover>
    );
}

export default Object.assign(AIChatInput, { Configure, getCustomSlotAttribute });
