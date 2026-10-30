<script lang="ts">
    import { type Component, untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import type { Editor, FocusPosition, Content as TiptapContent } from '@tiptap/core';
    import { isEqual } from 'es-toolkit';
    import { cssClasses, numbers } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import AIChatInputFoundation, { type AIChatInputAdapter, type AIChatInputBaseProps, type AIChatInputBaseState } from '@fibrae/semi-ai-foundation/ai-chat-input/foundation';
    import type { Attachment, Content, Reference, Suggestion } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
    import { getAttachmentType, getContentType, getListbox, getOptionId } from '@fibrae/semi-ai-foundation/ai-chat-input/utils';
    import { isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
    import { isUploadProgressVisible } from '@fibrae/semi-ai-foundation/upload-status';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import '@fibrae/semi-ai-foundation/ai-chat-input/ai-chat-input.scss';
    import { IconClose, IconCode, IconCrossStroked, IconExcel, IconFile, IconMusic, IconPdf, IconSendMsgStroked, IconTemplateStroked, IconVideo, IconWord } from '@fibrae/semi-icons-svelte';
    import { groupRole } from '@fibrae/semi-ui-svelte/_base/group-role';
    import useDefaultProps from '@fibrae/semi-ui-svelte/_base/use-default-props';
    import useFoundation from '@fibrae/semi-ui-svelte/_base/use-foundation.svelte.js';
    import watch from '@fibrae/semi-ui-svelte/_base/watch.svelte.js';
    import { Button } from '@fibrae/semi-ui-svelte/button/index';
    import { useConfig } from '@fibrae/semi-ui-svelte/config-provider/index';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { Popover } from '@fibrae/semi-ui-svelte/popover/index';
    import { Progress } from '@fibrae/semi-ui-svelte/progress/index';
    import type { TooltipTriggerProps } from '@fibrae/semi-ui-svelte/tooltip/index';
    import Configure from './configure/configure.svelte';
    import HorizontalScroller from './horizontal-scroller.svelte';
    import type { AIChatInputProps, AIChatInputSkillIconSnippetProps, AIChatInputSkillItemSnippetProps, AIChatInputSuggestionItemSnippetProps, AIChatInputTopSlotSnippetProps, Skill } from './interface.js';
    import RichTextInput from './rich-text-input.svelte';
    import SendButton from './send-button.svelte';
    import UploadButton from './upload-button.svelte';

    type Foundation = AIChatInputFoundation<AIChatInputBaseProps, AIChatInputBaseState>;
    type Adapter = AIChatInputAdapter<AIChatInputBaseProps, AIChatInputBaseState>;

    const defaults = useDefaultProps('AIChatInput');

    let {
        canSend = defaults('canSend'),
        clearContentOnGenerating = defaults('clearContentOnGenerating', true),
        defaultContent = defaults('defaultContent'),
        dropdownMatchTriggerWidth = defaults('dropdownMatchTriggerWidth', true),
        extensions = defaults('extensions'),
        generating = defaults('generating', false),
        keepSkillAfterSend = defaults('keepSkillAfterSend', false),
        placeholder = defaults('placeholder'),
        popoverProps = defaults('popoverProps'),
        references = defaults('references'),
        round = defaults('round', true),
        sendHotKey = defaults('sendHotKey', 'enter'),
        showPlaceholderWhenSkillOnly = defaults('showPlaceholderWhenSkillOnly', false),
        showReference = defaults('showReference', true),
        showTemplateButton = defaults('showTemplateButton', false),
        showUploadButton = defaults('showUploadButton', true),
        showUploadFile = defaults('showUploadFile', true),
        skillHotKey = defaults('skillHotKey'),
        skills = defaults('skills'),
        suggestions = defaults('suggestions'),
        templatesCls = defaults('templatesCls'),
        templatesStyle = defaults('templatesStyle'),
        topSlotPosition = defaults('topSlotPosition', 'top'),
        transformer = defaults('transformer'),
        uploadProps = defaults('uploadProps'),
        uploadTipProps = defaults('uploadTipProps'),
        onBlur,
        onConfigureChange,
        onContentChange,
        onFocus,
        onMessageSend,
        onPaste,
        onReferenceClick,
        onReferenceDelete,
        onSkillChange,
        onStopGenerate,
        onUploadChange,
        actionArea,
        configureArea,
        reference,
        skillIcon,
        skillItem,
        suggestionItem,
        template,
        topSlot,
        uploadButton,
        uploadTip,
        ...rest
    }: AIChatInputProps = $props();

    const config = useConfig();
    const locale = useLocale('AIChatInput');

    const uid = $props.id();
    let trigger = $state<HTMLDivElement>();
    let skillPanel = $state<HTMLDivElement>();
    let suggestionPanel = $state<HTMLDivElement>();
    let configure = $state<ReturnType<typeof Configure>>();

    // Pasted files go to any mounted upload button: a snippet of `actionArea` may render the node twice, or not at all
    const uploads = new SvelteSet<{ insert: (files: File[]) => void }>();
    let editor: Editor | undefined;
    let transformedContent = $state.raw<Content[]>([]);

    // A delete button leaves with its item while it holds focus; the editor is where typing continues
    let focusedBeforeUpdate: Element | null = null;
    let previousSuggestions = untrack(() => $state.snapshot(suggestions));

    const prefix = cssClasses.PREFIX;

    const FILE_ICONS: Record<string, Component<any>> = {
        file: IconWord,
        word: IconWord,
        code: IconCode,
        excel: IconExcel,
        video: IconVideo,
        audio: IconMusic,
        pdf: IconPdf,
    };

    const editorId = `${prefix}-editor-${uid}`;
    const skillListId = `${prefix}-skill-${uid}`;
    const suggestionListId = `${prefix}-suggestion-${uid}`;
    const actionCls = `${prefix}-footer-action`;

    // $bindable-free, but the foundation reads the props through getters all the same: it needs the current values
    const foundationProps: AIChatInputBaseProps = {
        get uploadProps() {
            return uploadProps;
        },
        get skills() {
            return skills;
        },
        get suggestions() {
            return suggestions;
        },
        get skillHotKey() {
            return skillHotKey;
        },
        get sendHotKey() {
            return sendHotKey;
        },
        get transformer() {
            return transformer;
        },
        get keepSkillAfterSend() {
            return keepSkillAfterSend;
        },
        get clearContentOnGenerating() {
            return clearContentOnGenerating;
        },
        get generating() {
            return generating;
        },
        get canSend() {
            return canSend;
        },
        get references() {
            return references;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, AIChatInputBaseProps, AIChatInputBaseState>(
        AIChatInputFoundation,
        foundationProps,
        () => ({
            templateVisible: false,
            skillVisible: false,
            suggestionVisible: false,
            attachments: uploadProps?.defaultFileList ?? [],
            content: undefined,
            skill: undefined,
            activeSkillIndex: 0,
            activeSuggestionIndex: 0,
        }),
        (base) => ({
            setContent,
            clearContent: () => setContent(''),
            clearAttachments: () => base.setState({ attachments: [] }),
            focusEditor,
            getEditor: () => editor,
            // the panel may render in a shadow root, out of reach of document queries
            getOptionNode: (kind, index) => {
                const node = (kind === 'skill' ? skillPanel : suggestionPanel)?.children[index];
                return node instanceof HTMLElement ? node : null;
            },
            notifySkillChange: (skill) => onSkillChange?.(skill),
            notifyContentChange: (result) => {
                transformedContent = result;
                onContentChange?.(result);
            },
            setTransformedContent: (result) => {
                transformedContent = result;
            },
            getActiveElement: () => (trigger ? FocusTrapHandle.getActiveElement(trigger) : null),
            notifyConfigureChange: (value, changedValue) => onConfigureChange?.(value, changedValue),
            manualUpload: (files) => [...uploads][0]?.insert(files),
            notifyMessageSend: (message) => onMessageSend?.(message),
            notifyStopGenerate: () => onStopGenerate?.(),
            getRichTextDiv: () => trigger?.querySelector<HTMLDivElement>(`.${prefix}-editor-content`) ?? null,
            notifyReferenceClick: (item) => onReferenceClick?.(item),
            notifyFocus: (event) => onFocus?.(event),
            notifyBlur: (event) => onBlur?.(event),
            notifyUploadChange: (change) => onUploadChange?.(change),
            notifyUploadPropsChange: (change) => uploadProps?.onChange?.(change),
            notifyUploadRemove: (file, fileList, fileItem) => uploadProps?.onRemove?.(file, fileList, fileItem),
            getConfigureValue: () => configure?.getConfigureValue(),
        })
    );

    const attachments = $derived(states().attachments ?? []);
    const listbox = $derived(getListbox(states(), { skills, suggestions }, { skillListId, suggestionListId }));
    const sendEnabled = $derived(AIChatInputFoundation.getCanSend(canSend, states().content, attachments));
    const panelVisible = $derived(states().templateVisible || states().skillVisible || states().suggestionVisible);

    const popover = $derived.by(() => {
        const { class: popoverClass, style, onClickOutSide, onEscKeyDown, ...others } = popoverProps ?? {};
        const { templateVisible, skillVisible, suggestionVisible } = states();
        return {
            others,
            onClickOutSide,
            onEscKeyDown,
            class: [suggestionVisible && `${prefix}-popover-suggestion`, skillVisible && `${prefix}-popover-skill`, templateVisible && `${prefix}-popover-template`, popoverClass].filter(Boolean).join(' ') || undefined,
            // the variable tracks the trigger width live, so a resize while open is followed
            style: [dropdownMatchTriggerWidth && 'width: var(--semi-tooltip-trigger-width)', style].filter(Boolean).join('; ') || undefined,
        };
    });

    const uploadButtonProps = $derived({ uploadProps, attachments, tipProps: uploadTipProps, hidden: !showUploadButton });

    const register = (handle: { insert: (files: File[]) => void }) => {
        uploads.add(handle);
        return () => uploads.delete(handle);
    };

    const iconType = (item: Attachment | Reference) => getContentType(getAttachmentType(item));

    const fileIcon = (type: string) => FILE_ICONS[type] ?? IconFile;

    const optionProps = (kind: 'skill' | 'suggestion', index: number, select: () => void) => {
        const active = kind === 'skill' ? states().activeSkillIndex === index : states().activeSuggestionIndex === index;
        return {
            id: getOptionId(kind === 'skill' ? skillListId : suggestionListId, index),
            class: [`${prefix}-${kind}-item`, { [`${prefix}-${kind}-item-active`]: active }],
            role: 'option' as const,
            'aria-selected': active,
            onclick: select,
            onmouseenter: () => (kind === 'skill' ? foundation.setActiveSkillIndex(index) : foundation.setActiveSuggestionIndex(index)),
        };
    };

    const skillOption = (skill: Skill, index: number): AIChatInputSkillItemSnippetProps => ({
        skill,
        ...optionProps('skill', index, () => foundation.handleSkillSelect(skill)),
    });

    const suggestionOption = (suggestion: Suggestion, index: number): AIChatInputSuggestionItemSnippetProps => ({
        suggestion,
        ...optionProps('suggestion', index, () => foundation.handleSuggestionSelect(suggestion)),
    });

    const skillIconProps = (item: Skill, index: number): AIChatInputSkillIconSnippetProps => ({ item, index });

    const topSlotProps = (): AIChatInputTopSlotSnippetProps => ({
        references: references ?? [],
        attachments,
        content: transformedContent,
        onUploadFileDelete: foundation.handleUploadFileDelete,
        onReferenceDelete: (item) => onReferenceDelete?.(item),
    });

    const onSendClick = () => (generating ? foundation.handleStopGenerate() : foundation.handleSend());

    // compared deeply: callers often pass a new array with the same items, and a mutation of a proxied array keeps its identity
    watch(
        () => $state.snapshot(suggestions),
        (current) => {
            if (isEqual(current, previousSuggestions)) {
                return;
            }
            previousSuggestions = current;
            if (current && current.length > 0) {
                foundation.showSuggestionPanel();
            } else {
                foundation.hideSuggestionPanel();
            }
        }
    );

    watch(
        () => generating,
        (isGenerating) => {
            if (isGenerating) {
                foundation.handleGeneratingStart();
            }
        }
    );

    $effect.pre(() => {
        void states().attachments;
        void references;
        untrack(() => {
            const active = FocusTrapHandle.getActiveElement(trigger);
            focusedBeforeUpdate = trigger?.contains(active) ? active : null;
        });
    });

    $effect(() => {
        void states().attachments;
        void references;
        untrack(() => {
            if (focusedBeforeUpdate) {
                handoverFocus(focusedBeforeUpdate, editor?.view.dom);
                focusedBeforeUpdate = null;
            }
        });
    });

    export function changeTemplateVisible(visible: boolean) {
        foundation.changeTemplateVisible(visible);
    }

    export function deleteContent(content: Content) {
        foundation.handleDeleteContent(content);
    }

    export function deleteUploadFile(item: Attachment) {
        foundation.handleUploadFileDelete(item);
    }

    // null and false are tiptap positions (keep the selection, do nothing), so only undefined falls back
    export function focusEditor(pos?: FocusPosition) {
        editor?.commands.focus(pos ?? 'end');
    }

    export function getEditor() {
        return editor;
    }

    export function setContent(content: TiptapContent) {
        editor?.commands.setContent(content);
    }

    export function setContentWhileSaveTool(content: string) {
        foundation.setContentWhileSaveTool(content);
    }
</script>

{#snippet uploadNode()}
    <UploadButton {...uploadButtonProps} onChange={foundation.onUploadChange} {register} {uploadButton} {uploadTip} />
{/snippet}

{#snippet sendNode()}
    <SendButton canSend={sendEnabled} {generating} onClick={onSendClick} />
{/snippet}

{#snippet topSlotNode()}
    {@render topSlot?.(topSlotProps())}
{/snippet}

{#snippet container({ props }: { props: TooltipTriggerProps })}
    <!-- the textbox is the Tab stop; Tooltip would add tabindex 0 here -->
    <div
        {...props}
        {...rest}
        bind:this={trigger}
        class={[prefix, rest.class]}
        role={groupRole(rest)}
        tabindex="-1"
        onclick={(event) => {
            rest.onclick?.(event);
            foundation.handleContainerClick(event);
        }}
        onmousedown={(event) => {
            rest.onmousedown?.(event);
            foundation.handleContainerMouseDown(event);
        }}
    >
        {#if topSlotPosition === 'top'}
            {@render topSlotNode()}
        {/if}
        {#if showReference && references?.length}
            <div class={`${prefix}-references`}>
                {#each references as item, index (item.id)}
                    {#if reference}
                        {@render reference({ item, index })}
                    {:else}
                        {@const Icon = fileIcon(iconType(item))}
                        <div class={`${prefix}-reference`}>
                            <IconSendMsgStroked />
                            <button class={`${prefix}-reference-content`} type="button" onclick={() => foundation.handleReferenceClick(item)}>
                                {#if item.type !== 'text'}
                                    {#if isImageFile(item.name, item.fileInstance?.type)}
                                        <img alt="" class={`${prefix}-reference-img`} src={item.url} />
                                    {:else}
                                        <span class={[`${prefix}-ref-icon`, `${prefix}-ref-icon-${iconType(item)}`, `${prefix}-reference-icon`]}>
                                            {#if iconType(item) !== 'text'}
                                                <Icon size="small" />
                                            {/if}
                                        </span>
                                    {/if}
                                {/if}
                                <span class={`${prefix}-reference-name`}>
                                    {item.type === 'text' ? item.content : item.name}
                                </span>
                            </button>
                            <!-- stopped: the container's click would move focus to the editor -->
                            <button
                                aria-label={locale().locale.removeReference}
                                class={`${prefix}-reference-delete`}
                                type="button"
                                onclick={(event) => {
                                    event.stopPropagation();
                                    onReferenceDelete?.(item);
                                }}
                            >
                                <IconCrossStroked size="small" />
                            </button>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
        {#if topSlotPosition === 'middle'}
            {@render topSlotNode()}
        {/if}
        {#if showUploadFile && attachments.length}
            <HorizontalScroller>
                {#each attachments as item (item.uid)}
                    {@const Icon = fileIcon(iconType(item))}
                    <div class={`${prefix}-attachment`}>
                        {#if isImageFile(item.name, item.fileInstance?.type)}
                            <img alt="" class={`${prefix}-attachment-img`} src={item.url} />
                        {:else}
                            <span class={[`${prefix}-attachment-icon`, `${prefix}-ref-icon`, `${prefix}-ref-icon-${iconType(item)}`]}>
                                {#if iconType(item) !== 'text'}
                                    <Icon size="large" />
                                {/if}
                            </span>
                        {/if}
                        <div class={`${prefix}-attachment-content`}>
                            <div class={`${prefix}-attachment-content-name`}>{item.name}</div>
                            <div class={`${prefix}-attachment-content-size`}>
                                {`${getAttachmentType(item)} ${item.size}`}
                            </div>
                        </div>
                        {#if isUploadProgressVisible(item)}
                            <Progress aria-label={locale().locale.uploadProgress} class={`${prefix}-attachment-progress`} percent={item.percent} showInfo={false} type="circle" width={30} />
                        {/if}
                        <button aria-label={locale().locale.removeAttachment} class={`${prefix}-attachment-delete`} disabled={uploadProps?.disabled} type="button" onclick={() => foundation.handleUploadFileDelete(item)}>
                            <IconClose size="small" />
                        </button>
                    </div>
                {/each}
            </HorizontalScroller>
        {/if}
        {#if topSlotPosition === 'bottom'}
            {@render topSlotNode()}
        {/if}
        <RichTextInput
            activeDescendant={listbox?.activeId}
            controls={listbox?.id}
            {defaultContent}
            {extensions}
            handleKeyDown={foundation.handleRichTextAreaKeyDown}
            id={editorId}
            onBlur={foundation.handleBlur}
            onChange={foundation.handleContentChange}
            onCreate={foundation.handleCreate}
            onFocus={foundation.handleFocus}
            onKeyDown={foundation.handleKeyDown}
            {onPaste}
            onPasteFiles={foundation.handlePaste}
            onReady={(instance) => (editor = instance)}
            {placeholder}
            {showPlaceholderWhenSkillOnly}
        />
        <div class={[`${prefix}-footer`, { [`${prefix}-footer-round`]: round }]}>
            <div class={`${prefix}-footer-configure`}>
                <Configure bind:this={configure} onChange={foundation.onConfigureChange}>
                    {@render configureArea?.()}
                </Configure>
                <!-- not a Configure item: templateVisible also changes on send and skill removal -->
                {#if showTemplateButton || states().skill?.hasTemplate}
                    <Button aria-pressed={states().templateVisible} class={[`${prefix}-footer-configure-button`, { [`${prefix}-footer-configure-button-active`]: states().templateVisible }]} theme="outline" type="tertiary" onclick={() => foundation.changeTemplateVisible(!states().templateVisible)}>
                        {#snippet icon()}
                            <IconTemplateStroked />
                        {/snippet}
                        {locale().locale.template}
                    </Button>
                {/if}
            </div>
            {#if actionArea}
                {@render actionArea({ upload: uploadNode, send: sendNode, class: actionCls })}
            {:else}
                <div class={actionCls}>
                    {@render uploadNode()}
                    {@render sendNode()}
                </div>
            {/if}
        </div>
    </div>
{/snippet}

{#snippet panel()}
    {#if states().templateVisible}
        <div class={[`${prefix}-template`, templatesCls]} style={[`max-height: ${numbers.TEMPLATE_MAX_HEIGHT}px`, templatesStyle].filter(Boolean).join('; ')}>
            {@render template?.({ onTemplateClick: setContent, skill: states().skill })}
        </div>
    {:else if states().skillVisible}
        <div aria-labelledby={editorId} bind:this={skillPanel} class={`${prefix}-skill`} id={skillListId} role="listbox" style={`max-height: ${numbers.SKILL_MAX_HEIGHT}px`}>
            {#each skills ?? [] as item, index (`${index}-${item.value}`)}
                {#if skillItem}
                    {@render skillItem(skillOption(item, index))}
                {:else}
                    <div {...optionProps('skill', index, () => foundation.handleSkillSelect(item))}>
                        {@render skillIcon?.(skillIconProps(item, index))}
                        <div class={`${prefix}-skill-item-content`}>{item.label}</div>
                    </div>
                {/if}
            {/each}
        </div>
    {:else if states().suggestionVisible}
        <div aria-labelledby={editorId} bind:this={suggestionPanel} class={`${prefix}-suggestion`} id={suggestionListId} role="listbox" style={`max-height: ${numbers.SUGGESTION_MAX_HEIGHT}px`}>
            <!-- the index is part of the key: the same text may appear twice -->
            {#each suggestions ?? [] as item, index (`${index}-${typeof item === 'string' ? item : item.content}`)}
                {#if suggestionItem}
                    {@render suggestionItem(suggestionOption(item, index))}
                {:else}
                    <div {...optionProps('suggestion', index, () => foundation.handleSuggestionSelect(item))}>
                        {typeof item === 'string' ? item : item.content}
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
{/snippet}

<!-- the lists are driven by the textbox, not a dialog that takes focus -->
<!-- a custom-trigger popup claims Escape and ignores outside presses, so the panels close here -->
<Popover
    position={config?.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'}
    {...popover.others}
    bind:visible={() => panelVisible, () => {}}
    child={container}
    class={popover.class}
    content={panel}
    disableArrowKeyDown
    onClickOutSide={(event) => {
        popover.onClickOutSide?.(event);
        foundation.hidePanels();
    }}
    onEscKeyDown={(event) => {
        popover.onEscKeyDown?.(event);
        foundation.hidePanels();
    }}
    role="presentation"
    style={popover.style}
    trigger="custom"
/>
