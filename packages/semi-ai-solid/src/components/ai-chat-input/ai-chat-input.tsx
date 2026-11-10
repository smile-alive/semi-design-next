import { For, Index, type JSX, Match, Show, Switch, createMemo, createUniqueId, mergeProps, splitProps, untrack } from 'solid-js';
import type { Editor } from '@tiptap/core';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses, numbers, strings } from '@fibrae/semi-ai-foundation/components/ai-chat-input/constants';
import AIChatInputFoundation, { type AIChatInputAdapter, type AIChatInputState } from '@fibrae/semi-ai-foundation/components/ai-chat-input/foundation';
import { type ContentType, getAttachmentType, getContentType, getListbox, getOptionId } from '@fibrae/semi-ai-foundation/components/ai-chat-input/utils';
import { isImageFile, isUploadProgressVisible } from '@fibrae/semi-ai-foundation/utils';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-ai-foundation/components/ai-chat-input/ai-chat-input.scss';
import { type IconSize, IconArrowUp, IconClose, IconCode, IconCrossStroked, IconExcel, IconFile, IconMusic, IconPaperclip, IconPdf, IconSendMsgStroked, IconStop, IconTemplateStroked, IconVideo, IconWord } from '@fibrae/semi-icons-solid';
import { useDefaultProps, useFoundation } from '@fibrae/semi-ui-solid/base';
import Button from '@fibrae/semi-ui-solid/button/index';
import useConfig from '@fibrae/semi-ui-solid/config-provider/use-config';
import Popover from '@fibrae/semi-ui-solid/popover/index';
import { useFocusHandover, useLocale } from '@fibrae/semi-ui-solid/primitives';
import Progress from '@fibrae/semi-ui-solid/progress/index';
import Tooltip, { type GetTriggerProps } from '@fibrae/semi-ui-solid/tooltip/index';
import { useAddAreaControl } from '@fibrae/semi-ui-solid/upload/context';
import Upload, { type UploadElement, type UploadProps } from '@fibrae/semi-ui-solid/upload/index';
import { callHandler, mergeRefs, mergeStyles } from '@fibrae/semi-ui-solid/utils';
import Configure, { type ConfigureHandle } from './configure';
import HorizontalScroller from './horizontal-scroller';
import type { AIChatInputHandle, AIChatInputProps, ActionAreaProps, Attachment, Reference, RenderTopSlotProps, RenderUploadButtonProps, Skill } from './interface';
import RichTextInput from './rich-text-input';
import SkillItem from './skill-item';
import SuggestionItem from './suggestion-item';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
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
} satisfies Partial<AIChatInputProps>;

const hiddenStyle = { display: 'none' } as const;

type Foundation = AIChatInputFoundation<AIChatInputProps>;
type Adapter = AIChatInputAdapter<AIChatInputProps>;

const FILE_ICONS = { word: IconWord, code: IconCode, excel: IconExcel, video: IconVideo, audio: IconMusic, pdf: IconPdf, ppt: IconFile, image: IconFile, unknown: IconFile } satisfies Record<ContentType, unknown>;

function getIconByType(type: ContentType, size: IconSize = 'small') {
    const Icon = FILE_ICONS[type];
    return <Icon size={size} />;
}

export default function AIChatInput(rawProps: AIChatInputProps) {
    const props = useDefaultProps('AIChatInput', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'ref',
        'class',
        'style',
        'onClick',
        'onMouseDown',
        'dropdownMatchTriggerWidth',
        'keepSkillAfterSend',
        'placeholder',
        'showPlaceholderWhenSkillOnly',
        'extensions',
        'onContentChange',
        'defaultContent',
        'onFocus',
        'onBlur',
        'onPaste',
        'references',
        'renderReference',
        'onReferenceDelete',
        'onReferenceClick',
        'uploadProps',
        'onUploadChange',
        'renderUploadButton',
        'renderTopSlot',
        'topSlotPosition',
        'showUploadFile',
        'showReference',
        'showUploadButton',
        'round',
        'canSend',
        'onMessageSend',
        'onStopGenerate',
        'uploadTipProps',
        'generating',
        'renderConfigureArea',
        'onConfigureChange',
        'renderActionArea',
        'suggestions',
        'renderSuggestionItem',
        'skills',
        'skillHotKey',
        'templatesStyle',
        'templatesCls',
        'onSkillChange',
        'renderSkillIcon',
        'renderSkillItem',
        'renderTemplate',
        'showTemplateButton',
        'transformer',
        'popoverProps',
        'sendHotKey',
        'clearContentOnGenerating',
    ]);

    const config = useConfig();
    const locale = useLocale('AIChatInput');

    const popupId = createUniqueId();
    let editor: Editor | null = null;
    let upload: UploadElement | null = null;
    let configure: ConfigureHandle | undefined;
    let richText: HTMLDivElement | undefined;
    let skillPanel: HTMLDivElement | undefined;
    let suggestionPanel: HTMLDivElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, AIChatInputProps, AIChatInputState>(
        AIChatInputFoundation,
        props,
        () => AIChatInputFoundation.getInitialState(props),
        () => ({
            getEditor: () => editor,
            // the panel may render in a shadow root, out of reach of document queries
            getOptionNode: (kind, index) => ((kind === 'skill' ? skillPanel : suggestionPanel)?.children[index] as HTMLElement | undefined) ?? null,
            notifySkillChange: (skill?: Skill) => local.onSkillChange?.(skill),
            notifyContentChange: (result) => local.onContentChange?.(result),
            notifyConfigureChange: (value, changedValue) => local.onConfigureChange?.(value, changedValue),
            manualUpload: (files) => upload?.insert(files),
            notifyMessageSend: (message) => local.onMessageSend?.(message),
            notifyStopGenerate: () => local.onStopGenerate?.(),
            getRichTextDiv: () => richText ?? null,
            notifyReferenceClick: (reference) => local.onReferenceClick?.(reference),
            notifyFocus: (event) => local.onFocus?.(event),
            notifyBlur: (event) => local.onBlur?.(event),
            notifyUploadChange: (changed) => local.onUploadChange?.(changed),
            notifyUploadPropsChange: (changed) => local.uploadProps?.onChange?.(changed),
            notifyBeforeRemove: (file, fileList) => local.uploadProps?.beforeRemove?.(file, fileList),
            notifyUploadRemove: (file, fileList, fileItem) => local.uploadProps?.onRemove?.(file, fileList, fileItem),
            getConfigureValue: () => configure?.getConfigureValue(),
        })
    );

    // a delete button leaves with its item while it holds focus; the editor is where typing continues
    // tiptap throws on reading the view of a destroyed editor, which is the case when the whole input unmounts
    const handoverToEditor = useFocusHandover<HTMLButtonElement>(() => (editor && !editor.isDestroyed ? editor.view.dom : null));

    const editorId = `${prefixCls}-editor-${popupId}`;
    const skillListId = `${prefixCls}-skill-${popupId}`;
    const suggestionListId = `${prefixCls}-suggestion-${popupId}`;
    const actionCls = `${prefixCls}-footer-action`;

    // a consumer spreading a signal object notifies every prop on any change, which must not redraw these nodes
    const uploadTipProps = createMemo(() => local.uploadTipProps);
    const renderUploadButton = createMemo(() => local.renderUploadButton);
    const uploadChildren = createMemo(() => local.uploadProps?.children);
    const renderTemplate = createMemo(() => local.renderTemplate);

    // read here, untracked: the root is created inside the Popover's children
    const ref = props.ref;

    const rootOwn = mergeProps(rest, {
        ref: (element: HTMLDivElement) => mergeRefs(ref)(Object.assign(element, handle)),
        get role() {
            return namedRole(rest);
        },
        get class() {
            return clsx(prefixCls, local.class);
        },
        get style() {
            return local.style;
        },
        // the textbox is the Tab stop; the Popover trigger would take tabindex 0
        tabIndex: -1,
        onClick: (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
            callHandler(local.onClick, e);
            foundation.handleContainerClick(e);
        },
        onMouseDown: (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
            callHandler(local.onMouseDown, e);
            foundation.handleContainerMouseDown(e);
        },
    });

    // a new skill or template renderer redraws the template; the renderer itself is not tracked
    const templateSkill = createMemo(() => state().skill);

    const handle: AIChatInputHandle = {
        changeTemplateVisible: foundation.changeTemplateVisible,
        deleteContent: foundation.handleDeleteContent,
        deleteUploadFile: foundation.handleUploadFileDelete,
        focusEditor: foundation.focusEditor,
        getEditor: () => editor,
        setContent: foundation.setContent,
        setContentWhileSaveTool: foundation.setContentWhileSaveTool,
    };

    const transformedContent = createMemo(() => AIChatInputFoundation.getTransformedContent(state().content, local.transformer));

    const openFileDialog = () => upload?.openFileDialog();

    const attachments = () => state().attachments ?? [];

    const topSlotProps: RenderTopSlotProps = {
        get references() {
            return local.references ?? [];
        },
        get attachments() {
            return attachments();
        },
        get content() {
            return transformedContent();
        },
        handleUploadFileDelete: foundation.handleUploadFileDelete,
        handleReferenceDelete: (reference) => local.onReferenceDelete?.(reference),
    };

    const listbox = () => getListbox(state(), local, { skillListId, suggestionListId });

    const topSlot = () => (
        <Show when={local.renderTopSlot} keyed>
            {(render) => render(topSlotProps)}
        </Show>
    );

    const sendEnabled = () => AIChatInputFoundation.getCanSend(local.canSend, state().content, attachments());

    const sendNode = () => (
        <button
            type="button"
            class={clsx(`${prefixCls}-footer-action-button`, {
                [`${prefixCls}-footer-action-send`]: !local.generating,
                [`${prefixCls}-footer-action-stop`]: local.generating,
                [`${prefixCls}-footer-action-send-disabled`]: !local.generating && !sendEnabled(),
            })}
            // not disabled: keeps focus, and handleSend already ignores the click
            aria-disabled={!local.generating && !sendEnabled() ? 'true' : undefined}
            aria-label={local.generating ? locale().locale.stop : locale().locale.send}
            onClick={() => (local.generating ? foundation.handleStopGenerate() : foundation.handleSend())}
        >
            <Show when={local.generating} fallback={<IconArrowUp />}>
                <IconStop />
            </Show>
        </button>
    );

    // uploadProps is optional, Upload's action is not
    const uploadAttrs = () => ({ ...omit(local.uploadProps ?? ({} as Omit<UploadProps, 'fileList' | 'listType'>), ['children', 'ref']), action: local.uploadProps?.action ?? '' });

    const uploadButton = (own: Record<string, unknown> = {}) => {
        // Upload's add area yields its role and tab stop to this button, on the server too; aria-disabled keeps it
        // focusable so the upload tip reaches the keyboard
        useAddAreaControl();
        return (
            <button {...own} type="button" class={`${prefixCls}-footer-action-button ${prefixCls}-footer-action-upload`} aria-disabled={local.uploadProps?.disabled ? 'true' : undefined} aria-label={locale().locale.upload}>
                <IconPaperclip />
            </button>
        );
    };

    const renderUploadTrigger = (getTriggerProps?: GetTriggerProps) => {
        const render = renderUploadButton();
        // a render function: a default the custom button ignores would be an uninserted node, which shifts hydration keys
        const renderProps: RenderUploadButtonProps = {
            defaultNode: () => uploadChildren() ?? uploadButton(getTriggerProps?.()),
            openFileDialog,
            get disabled() {
                return Boolean(local.uploadProps?.disabled);
            },
            get attachments() {
                return attachments();
            },
        };
        return render ? render(renderProps) : renderProps.defaultNode();
    };

    // redrawn when the tip or the node it decorates changes; the render functions' own reads are not tracked
    const uploadTrigger = () => {
        const tipProps = uploadTipProps();
        const custom = Boolean(uploadChildren() || renderUploadButton());
        return untrack(() => {
            if (!tipProps) {
                return renderUploadTrigger();
            }
            // a custom node may not hold the default button, so the tip wraps it in its span
            if (custom) {
                return <Tooltip {...tipProps}>{renderUploadTrigger()}</Tooltip>;
            }
            // the tip goes on the button, so aria-describedby lands on it and no Tab stop is added
            return <Tooltip {...tipProps}>{(getTriggerProps) => renderUploadTrigger(getTriggerProps)}</Tooltip>;
        });
    };

    const uploadNode = () => (
        <Show when={local.showUploadButton}>
            <Upload {...uploadAttrs()} fileList={state().attachments} listType="none" onChange={foundation.onUploadChange}>
                {uploadTrigger()}
            </Upload>
        </Show>
    );

    // thunks: a node the custom action area leaves out would be created uninserted, which shifts hydration keys
    const actionAreaProps: ActionAreaProps = { menuItem: [uploadNode, sendNode], class: actionCls };

    const templateNode = () => {
        const render = renderTemplate();
        const skill = templateSkill();
        return untrack(() => render?.(skill, foundation.setContent));
    };

    const renderPanel = () => (
        <Switch>
            <Match when={state().templateVisible}>
                <div class={clsx(`${prefixCls}-template`, local.templatesCls)} style={{ 'max-height': `${numbers.TEMPLATE_MAX_HEIGHT}px`, ...local.templatesStyle }}>
                    {templateNode()}
                </div>
            </Match>
            <Match when={state().skillVisible}>
                <div ref={(element) => (skillPanel = element)} id={skillListId} class={`${prefixCls}-skill`} style={{ 'max-height': `${numbers.SKILL_MAX_HEIGHT}px` }} aria-labelledby={editorId} role="listbox">
                    {/* value is optional and may repeat, so rows follow the position */}
                    <Index each={local.skills}>
                        {(item, index) => (
                            <SkillItem id={getOptionId(skillListId, index)} active={state().activeSkillIndex === index} skill={item()} renderSkillIcon={local.renderSkillIcon} renderSkillItem={local.renderSkillItem} onClick={foundation.handleSkillSelect} onMouseEnter={() => foundation.setActiveSkillIndex(index)} />
                        )}
                    </Index>
                </div>
            </Match>
            <Match when={state().suggestionVisible}>
                <div ref={(element) => (suggestionPanel = element)} id={suggestionListId} class={`${prefixCls}-suggestion`} style={{ 'max-height': `${numbers.SUGGESTION_MAX_HEIGHT}px` }} aria-labelledby={editorId} role="listbox">
                    {/* suggestions may repeat and carry no id, so rows follow the position */}
                    <Index each={local.suggestions}>
                        {(item, index) => (
                            <SuggestionItem id={getOptionId(suggestionListId, index)} active={state().activeSuggestionIndex === index} suggestion={item()} renderSuggestionItem={local.renderSuggestionItem} onClick={foundation.handleSuggestionSelect} onMouseEnter={() => foundation.setActiveSuggestionIndex(index)} />
                        )}
                    </Index>
                </div>
            </Match>
        </Switch>
    );

    const renderReference = (item: Reference) => {
        const signIconType = () => getContentType(getAttachmentType(item));
        return (
            <Show
                when={local.renderReference}
                keyed
                fallback={
                    <div class={`${prefixCls}-reference`}>
                        <IconSendMsgStroked />
                        <button type="button" class={`${prefixCls}-reference-content`} onClick={() => foundation.handleReferenceClick(item)}>
                            <Show when={item.type !== 'text'}>
                                <Show when={isImageFile(item.name, item.fileInstance?.type)} fallback={<span class={`${prefixCls}-ref-icon ${prefixCls}-ref-icon-${signIconType()} ${prefixCls}-reference-icon`}>{getIconByType(signIconType())}</span>}>
                                    <img class={`${prefixCls}-reference-img`} alt="" src={item.url} />
                                </Show>
                            </Show>
                            <span class={`${prefixCls}-reference-name`}>{item.type === 'text' ? item.content : item.name}</span>
                        </button>
                        <button
                            ref={handoverToEditor}
                            type="button"
                            class={`${prefixCls}-reference-delete`}
                            aria-label={locale().locale.removeReference}
                            onClick={(e) => {
                                local.onReferenceDelete?.(item);
                                e.stopPropagation();
                            }}
                        >
                            <IconCrossStroked size="small" />
                        </button>
                    </div>
                }
            >
                {(render) => render(item)}
            </Show>
        );
    };

    const renderAttachment = (uid: string) => {
        // a row keeps its last item while the list it left is still being removed
        const find = () => attachments().find((attachment) => attachment.uid === uid);
        const item = createMemo<Attachment>((prev) => find() ?? prev, untrack(find) as Attachment);
        const realType = () => getAttachmentType(item());
        const signIconType = () => getContentType(realType());
        return (
            <div class={`${prefixCls}-attachment`}>
                <Show when={isImageFile(item().name, item().fileInstance?.type)} fallback={<span class={`${prefixCls}-attachment-icon ${prefixCls}-ref-icon ${prefixCls}-ref-icon-${signIconType()}`}>{getIconByType(signIconType(), 'large')}</span>}>
                    <img class={`${prefixCls}-attachment-img`} alt="" src={item().url} />
                </Show>
                <div class={`${prefixCls}-attachment-content`}>
                    <div class={`${prefixCls}-attachment-content-name`}>{item().name}</div>
                    <div class={`${prefixCls}-attachment-content-size`}>{`${realType()} ${item().size}`}</div>
                </div>
                <Show when={isUploadProgressVisible(item())}>
                    <Progress type="circle" class={`${prefixCls}-attachment-progress`} aria-label={locale().locale.uploadProgress} percent={item().percent} showInfo={false} width={30} />
                </Show>
                <button ref={handoverToEditor} type="button" class={`${prefixCls}-attachment-delete`} aria-label={locale().locale.removeAttachment} disabled={local.uploadProps?.disabled} onClick={() => foundation.handleUploadFileDelete(item())}>
                    <IconClose size="small" />
                </button>
            </div>
        );
    };

    const attachmentUids = () => attachments().map((attachment) => attachment.uid);

    const popoverStyle = (): JSX.CSSProperties | string | undefined => {
        const style = local.popoverProps?.style;
        if (!local.dropdownMatchTriggerWidth) {
            return style;
        }
        // the variable follows the trigger width while open, so a resize is followed
        return mergeStyles({ width: 'var(--semi-tooltip-trigger-width)' }, style);
    };

    return (
        <Popover
            position={config().direction === 'rtl' ? 'bottomRight' : 'bottomLeft'}
            {...local.popoverProps}
            class={clsx(local.popoverProps?.class, {
                [`${prefixCls}-popover-suggestion`]: state().suggestionVisible,
                [`${prefixCls}-popover-skill`]: state().skillVisible,
                [`${prefixCls}-popover-template`]: state().templateVisible,
            })}
            style={popoverStyle()}
            // the lists are driven by the textbox, not a dialog that takes focus
            role="presentation"
            content={renderPanel}
            disableArrowKeyDown
            trigger="custom"
            visible={state().templateVisible || state().skillVisible || state().suggestionVisible}
            // a custom-trigger popup claims Escape and ignores outside presses, so the panels close here
            onClickOutSide={(e) => {
                local.popoverProps?.onClickOutSide?.(e);
                foundation.hidePanels();
            }}
            onEscKeyDown={(e) => {
                local.popoverProps?.onEscKeyDown?.(e);
                foundation.hidePanels();
            }}
        >
            {(getTriggerProps) => (
                <div {...(getTriggerProps(rootOwn) as JSX.HTMLAttributes<HTMLDivElement>)}>
                    <Show when={local.topSlotPosition === 'top'}>{topSlot()}</Show>
                    <Show when={local.showReference && local.references?.length}>
                        <div class={`${prefixCls}-references`}>
                            <For each={local.references}>{renderReference}</For>
                        </div>
                    </Show>
                    <Show when={local.topSlotPosition === 'middle'}>{topSlot()}</Show>
                    <Show when={local.showUploadFile && attachments().length}>
                        <HorizontalScroller prefix={prefixCls}>
                            <For each={attachmentUids()}>{renderAttachment}</For>
                        </HorizontalScroller>
                    </Show>
                    <Show when={local.topSlotPosition === 'bottom'}>{topSlot()}</Show>
                    <RichTextInput
                        id={editorId}
                        placeholder={local.placeholder}
                        activeDescendant={listbox()?.activeId}
                        controls={listbox()?.id}
                        defaultContent={local.defaultContent}
                        extensions={local.extensions}
                        showPlaceholderWhenSkillOnly={local.showPlaceholderWhenSkillOnly}
                        ref={(element) => (richText = element)}
                        onCreate={(instance) => {
                            editor = instance;
                            foundation.handleCreate();
                        }}
                        handleKeyDown={foundation.handleKeyDown}
                        onBlur={foundation.handleBlur}
                        onChange={foundation.handleContentChange}
                        onFocus={foundation.handleFocus}
                        onPasteFiles={foundation.handlePaste}
                        onPaste={(e) => local.onPaste?.(e)}
                    />
                    <div class={clsx(`${prefixCls}-footer`, { [`${prefixCls}-footer-round`]: local.round })}>
                        <div class={cssClasses.FOOTER_CONFIGURE}>
                            <Configure ref={(instance) => (configure = instance)} onChange={foundation.onConfigureChange}>
                                <Show when={local.renderConfigureArea} keyed>
                                    {(render) => render()}
                                </Show>
                            </Configure>
                            {/* not a Configure item: templateVisible also changes on send and skill removal */}
                            <Show when={local.showTemplateButton || state().skill?.hasTemplate}>
                                <Button
                                    type="tertiary"
                                    class={clsx(`${prefixCls}-footer-configure-button`, {
                                        [`${prefixCls}-footer-configure-button-active`]: state().templateVisible,
                                    })}
                                    aria-pressed={state().templateVisible}
                                    theme="outline"
                                    icon={<IconTemplateStroked />}
                                    onClick={() => foundation.changeTemplateVisible(!state().templateVisible)}
                                >
                                    {locale().locale.template}
                                </Button>
                            </Show>
                        </div>
                        <Show
                            when={local.renderActionArea}
                            keyed
                            fallback={
                                <div class={actionCls}>
                                    {uploadNode()}
                                    {sendNode()}
                                </div>
                            }
                        >
                            {(render) => render(actionAreaProps)}
                        </Show>
                        {/* paste upload, openFileDialog and uploadProps.ref go through this Upload, so they work whatever the action area renders */}
                        <Upload {...uploadAttrs()} ref={mergeRefs<UploadElement>((element) => (upload = element), local.uploadProps?.ref)} id={undefined} style={hiddenStyle} fileList={state().attachments} listType="none" onChange={foundation.onUploadChange} />
                    </div>
                </div>
            )}
        </Popover>
    );
}
