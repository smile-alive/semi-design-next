<script setup lang="ts">
    import { computed, h, onBeforeUpdate, onDeactivated, onUpdated, shallowRef, useId, useTemplateRef, watch, type Component, type ComponentPublicInstance } from 'vue';
    import type { Editor, FocusPosition, Content as TiptapContent } from '@tiptap/core';
    import { isEqual } from 'es-toolkit';
    import { cssClasses, numbers } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import AIChatInputFoundation, { type AIChatInputAdapter, type AIChatInputBaseState } from '@fibrae/semi-ai-foundation/ai-chat-input/foundation';
    import type { Attachment, Content, Reference, Suggestion } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
    import { getAttachmentType, getContentType, getListbox, getOptionId } from '@fibrae/semi-ai-foundation/ai-chat-input/utils';
    import { isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
    import { isUploadProgressVisible } from '@fibrae/semi-ai-foundation/upload-status';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import '@fibrae/semi-ai-foundation/ai-chat-input/ai-chat-input.scss';
    import { IconClose, IconCode, IconCrossStroked, IconExcel, IconFile, IconMusic, IconPdf, IconSendMsgStroked, IconTemplateStroked, IconVideo, IconWord } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import { groupRole } from '@fibrae/semi-ui-vue/_base/group-role';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '@fibrae/semi-ui-vue/_base/semi-default';
    import useFoundation from '@fibrae/semi-ui-vue/_base/use-foundation';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import useConfig from '@fibrae/semi-ui-vue/config-provider/use-config';
    import { useDidUpdate, useLocale } from '@fibrae/semi-ui-vue/hooks';
    import Popover from '@fibrae/semi-ui-vue/popover/index';
    import Progress from '@fibrae/semi-ui-vue/progress/index';
    import Configure from './configure';
    import HorizontalScroller from './horizontal-scroller.vue';
    import type { AIChatInputEmits, AIChatInputHandle, AIChatInputProps, AIChatInputSkillItemSlotProps, AIChatInputSlots, AIChatInputSuggestionItemSlotProps, AIChatInputTopSlotProps, Skill } from './interface';
    import RichTextInput from './rich-text-input.vue';
    import SendButton from './send-button.vue';
    import UploadButton from './upload-button.vue';

    type Foundation = AIChatInputFoundation<AIChatInputProps, AIChatInputBaseState>;
    type Adapter = AIChatInputAdapter<AIChatInputProps, AIChatInputBaseState>;

    defineOptions({ name: 'AIChatInput', inheritAttrs: false });

    const props = withDefaults(defineProps<AIChatInputProps & /* @vue-ignore */ ElementProps<'div', keyof AIChatInputProps | EmitHandlers<AIChatInputEmits>>>(), {
        canSend: semiGlobalDefault('AIChatInput', 'canSend'),
        clearContentOnGenerating: () => semiDefault('AIChatInput', 'clearContentOnGenerating', true),
        defaultContent: semiGlobalDefault('AIChatInput', 'defaultContent'),
        dropdownMatchTriggerWidth: () => semiDefault('AIChatInput', 'dropdownMatchTriggerWidth', true),
        extensions: semiGlobalDefault('AIChatInput', 'extensions'),
        generating: () => semiDefault('AIChatInput', 'generating', false),
        keepSkillAfterSend: () => semiDefault('AIChatInput', 'keepSkillAfterSend', false),
        // A Function-typed prop cannot take a factory default; its global default is read in `placeholder` below
        placeholder: undefined,
        popoverProps: semiGlobalDefault('AIChatInput', 'popoverProps'),
        references: semiGlobalDefault('AIChatInput', 'references'),
        round: () => semiDefault('AIChatInput', 'round', true),
        sendHotKey: () => semiDefault('AIChatInput', 'sendHotKey', 'enter'),
        showPlaceholderWhenSkillOnly: () => semiDefault('AIChatInput', 'showPlaceholderWhenSkillOnly', false),
        showReference: () => semiDefault('AIChatInput', 'showReference', true),
        showTemplateButton: () => semiDefault('AIChatInput', 'showTemplateButton', false),
        showUploadButton: () => semiDefault('AIChatInput', 'showUploadButton', true),
        showUploadFile: () => semiDefault('AIChatInput', 'showUploadFile', true),
        skillHotKey: semiGlobalDefault('AIChatInput', 'skillHotKey'),
        skills: semiGlobalDefault('AIChatInput', 'skills'),
        suggestions: semiGlobalDefault('AIChatInput', 'suggestions'),
        templatesCls: semiGlobalDefault('AIChatInput', 'templatesCls'),
        templatesStyle: semiGlobalDefault('AIChatInput', 'templatesStyle'),
        topSlotPosition: () => semiDefault('AIChatInput', 'topSlotPosition', 'top'),
        transformer: semiGlobalDefault('AIChatInput', 'transformer'),
        uploadProps: semiGlobalDefault('AIChatInput', 'uploadProps'),
        uploadTipProps: semiGlobalDefault('AIChatInput', 'uploadTipProps'),
    });

    const emit = defineEmits<AIChatInputEmits>();
    const slots = defineSlots<AIChatInputSlots>();

    const semi = useSemiGlobal();
    const config = useConfig();
    const i18n = useLocale('AIChatInput');

    const popupId = useId();

    // explicit: the adapter reads these refs and the template binds the foundation to their targets, so inference is circular (TS7022)
    const trigger = useTemplateRef<HTMLDivElement>('trigger');
    const richText = useTemplateRef<ComponentPublicInstance>('richText');
    const skillPanel = useTemplateRef<HTMLDivElement>('skillPanel');
    const suggestionPanel = useTemplateRef<HTMLDivElement>('suggestionPanel');
    const configure = useTemplateRef('configure');

    // A string ref binds to this component even when the node is placed by #actionArea, and keeps the remaining instance
    // when the caller drops one of two rendered upload nodes
    const upload = useTemplateRef('upload');
    let editor: Editor | null = null;
    const transformedContent = shallowRef<Content[]>([]);

    // A delete button leaves with its item while it holds focus; the editor is where typing continues
    let focusedBeforeUpdate: Element | null = null;

    const prefix = cssClasses.PREFIX;

    const FILE_ICONS: Record<string, Component> = {
        file: IconWord,
        word: IconWord,
        code: IconCode,
        excel: IconExcel,
        video: IconVideo,
        audio: IconMusic,
        pdf: IconPdf,
    };

    const editorId = `${prefix}-editor-${popupId}`;
    const skillListId = `${prefix}-skill-${popupId}`;
    const suggestionListId = `${prefix}-suggestion-${popupId}`;
    const placeholder = computed(() => props.placeholder ?? readSemiDefault(semi, 'AIChatInput', 'placeholder'));
    const actionCls = `${prefix}-footer-action`;

    const iconType = (item: Attachment | Reference) => getContentType(getAttachmentType(item));

    const fileIcon = (type: string) => FILE_ICONS[type] ?? IconFile;

    const setContent = (content: TiptapContent) => editor?.commands.setContent(content);

    // null and false are tiptap positions (keep the selection, do nothing), so only undefined falls back
    const focusEditor = (pos?: FocusPosition) => editor?.commands.focus(pos ?? 'end');

    const { foundation, state } = useFoundation<Foundation, Adapter, AIChatInputProps, AIChatInputBaseState>(
        AIChatInputFoundation,
        props,
        () => ({
            templateVisible: false,
            skillVisible: false,
            suggestionVisible: false,
            attachments: props.uploadProps?.defaultFileList ?? [],
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
            getOptionNode: (kind, index) => ((kind === 'skill' ? skillPanel : suggestionPanel).value?.children[index] as HTMLElement | undefined) ?? null,
            notifySkillChange: (skill) => emit('skillChange', skill),
            notifyContentChange: (result) => {
                transformedContent.value = result;
                emit('contentChange', result);
            },
            setTransformedContent: (result) => {
                transformedContent.value = result;
            },
            getActiveElement: () => (trigger.value?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement ?? null,
            notifyConfigureChange: (value, changedValue) => emit('configureChange', value, changedValue),
            manualUpload: (files) => upload.value?.insert(files),
            notifyMessageSend: (message) => emit('messageSend', message),
            notifyStopGenerate: () => emit('stopGenerate'),
            getRichTextDiv: () => (richText.value?.$el as HTMLDivElement | undefined) ?? null,
            notifyReferenceClick: (reference) => emit('referenceClick', reference),
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            notifyUploadChange: (change) => emit('uploadChange', change),
            notifyUploadPropsChange: (change) => base.getProp('uploadProps')?.onChange?.(change),
            notifyUploadRemove: (file, fileList, fileItem) => base.getProp('uploadProps')?.onRemove?.(file, fileList, fileItem),
            getConfigureValue: () => configure.value?.getConfigureValue(),
        })
    );

    const listbox = computed(() => getListbox(state.value, props, { skillListId, suggestionListId }));

    const popoverBindings = computed(() => {
        const { class: popoverClass, style, ...rest } = props.popoverProps ?? {};
        const { templateVisible, skillVisible, suggestionVisible } = state.value;
        return {
            position: config.value.direction === 'rtl' ? ('bottomRight' as const) : ('bottomLeft' as const),
            ...rest,
            class: [
                {
                    [`${prefix}-popover-suggestion`]: suggestionVisible,
                    [`${prefix}-popover-skill`]: skillVisible,
                    [`${prefix}-popover-template`]: templateVisible,
                },
                popoverClass,
            ],
            // the variable tracks the trigger width live, so a resize while open is followed
            style: props.dropdownMatchTriggerWidth ? [{ width: 'var(--semi-tooltip-trigger-width)' }, style] : style,
        };
    });

    const sendEnabled = computed(() => AIChatInputFoundation.getCanSend(props.canSend, state.value.content, state.value.attachments ?? []));

    const onEditorReady = (instance: Editor) => {
        editor = instance;
    };

    const optionAttrs = (kind: 'skill' | 'suggestion', index: number, select: () => void) => {
        const active = kind === 'skill' ? state.value.activeSkillIndex === index : state.value.activeSuggestionIndex === index;
        return {
            id: getOptionId(kind === 'skill' ? skillListId : suggestionListId, index),
            class: [`${prefix}-${kind}-item`, { [`${prefix}-${kind}-item-active`]: active }],
            role: 'option' as const,
            'aria-selected': active,
            onClick: select,
            onMouseenter: () => (kind === 'skill' ? foundation.setActiveSkillIndex(index) : foundation.setActiveSuggestionIndex(index)),
        };
    };

    const skillOption = (skill: Skill, index: number): AIChatInputSkillItemSlotProps => ({
        skill,
        ...optionAttrs('skill', index, () => foundation.handleSkillSelect(skill)),
    });

    const suggestionOption = (suggestion: Suggestion, index: number): AIChatInputSuggestionItemSlotProps => ({
        suggestion,
        ...optionAttrs('suggestion', index, () => foundation.handleSuggestionSelect(suggestion)),
    });

    const topSlotProps = (): AIChatInputTopSlotProps => ({
        references: props.references ?? [],
        attachments: state.value.attachments ?? [],
        content: transformedContent.value,
        onUploadFileDelete: foundation.handleUploadFileDelete,
        onReferenceDelete: (reference) => emit('referenceDelete', reference),
    });

    const onSendClick = () => (props.generating ? foundation.handleStopGenerate() : foundation.handleSend());

    const uploadButtonProps = () => ({
        uploadProps: props.uploadProps,
        attachments: state.value.attachments ?? [],
        tipProps: props.uploadTipProps,
        hidden: !props.showUploadButton,
    });

    const actionNodes = () => {
        const send = h(SendButton, { generating: props.generating, canSend: sendEnabled.value, onClick: onSendClick });
        // the slots interface has no index signature, so h() takes a plain-object copy
        return [h(UploadButton, { ...uploadButtonProps(), ref: 'upload', onChange: foundation.onUploadChange }, { ...slots }), send];
    };

    // compared deeply: callers often pass a new array with the same items
    useDidUpdate(
        () => props.suggestions,
        (current) => {
            if (current && current.length > 0) {
                foundation.showSuggestionPanel();
            } else {
                foundation.hideSuggestionPanel();
            }
        },
        isEqual
    );

    watch(
        () => props.generating,
        (isGenerating) => {
            if (isGenerating) {
                foundation.handleGeneratingStart();
            }
        },
        { flush: 'post' }
    );

    // a cached instance would otherwise come back with a panel open over whatever replaced it
    onDeactivated(() => foundation.setState({ templateVisible: false, skillVisible: false, suggestionVisible: false }));

    onBeforeUpdate(() => {
        const active = FocusTrapHandle.getActiveElement(trigger.value);
        focusedBeforeUpdate = trigger.value?.contains(active) ? active : null;
    });

    onUpdated(() => {
        if (focusedBeforeUpdate) {
            handoverFocus(focusedBeforeUpdate, editor?.view.dom);
            focusedBeforeUpdate = null;
        }
    });

    defineExpose<AIChatInputHandle>({
        changeTemplateVisible: foundation.changeTemplateVisible,
        deleteContent: foundation.handleDeleteContent,
        deleteUploadFile: foundation.handleUploadFileDelete,
        focusEditor,
        getEditor: () => editor,
        setContent,
        setContentWhileSaveTool: foundation.setContentWhileSaveTool,
    });
</script>

<template>
    <!-- the lists are driven by the textbox, not a dialog that takes focus -->
    <!-- a custom-trigger popup claims Escape and ignores outside presses, so the panels close here -->
    <Popover v-bind="popoverBindings" disableArrowKeyDown role="presentation" trigger="custom" :visible="state.templateVisible || state.skillVisible || state.suggestionVisible" @clickOutSide="foundation.hidePanels" @escKeyDown="foundation.hidePanels">
        <!-- the textbox is the Tab stop; Tooltip would add tabIndex 0 here -->
        <div ref="trigger" v-bind="$attrs" :class="prefix" :role="groupRole($attrs)" tabindex="-1" @click="foundation.handleContainerClick" @mousedown="foundation.handleContainerMouseDown">
            <slot v-if="props.topSlotPosition === 'top'" name="topSlot" v-bind="topSlotProps()" />
            <div v-if="props.showReference && props.references?.length" :class="`${prefix}-references`">
                <template v-for="(item, index) in props.references" :key="item.id">
                    <slot v-if="$slots.reference" :index="index" :item="item" name="reference" />
                    <div v-else :class="`${prefix}-reference`">
                        <IconSendMsgStroked />
                        <button :class="`${prefix}-reference-content`" type="button" @click="foundation.handleReferenceClick(item)">
                            <template v-if="item.type !== 'text'">
                                <img v-if="isImageFile(item.name, item.fileInstance?.type)" alt="" :class="`${prefix}-reference-img`" :src="item.url" />
                                <span v-else :class="[`${prefix}-ref-icon`, `${prefix}-ref-icon-${iconType(item)}`, `${prefix}-reference-icon`]">
                                    <component :is="fileIcon(iconType(item))" v-if="iconType(item) !== 'text'" size="small" />
                                </span>
                            </template>
                            <span :class="`${prefix}-reference-name`">
                                {{ item.type === 'text' ? item.content : item.name }}
                            </span>
                        </button>
                        <!-- stopped: the container's click would move focus to the editor -->
                        <button :aria-label="i18n.locale.removeReference" :class="`${prefix}-reference-delete`" type="button" @click.stop="emit('referenceDelete', item)">
                            <IconCrossStroked size="small" />
                        </button>
                    </div>
                </template>
            </div>
            <slot v-if="props.topSlotPosition === 'middle'" name="topSlot" v-bind="topSlotProps()" />
            <HorizontalScroller v-if="props.showUploadFile && state.attachments?.length">
                <div v-for="item in state.attachments" :key="item.uid" :class="`${prefix}-attachment`">
                    <img v-if="isImageFile(item.name, item.fileInstance?.type)" alt="" :class="`${prefix}-attachment-img`" :src="item.url" />
                    <span v-else :class="[`${prefix}-attachment-icon`, `${prefix}-ref-icon`, `${prefix}-ref-icon-${iconType(item)}`]">
                        <component :is="fileIcon(iconType(item))" v-if="iconType(item) !== 'text'" size="large" />
                    </span>
                    <div :class="`${prefix}-attachment-content`">
                        <div :class="`${prefix}-attachment-content-name`">{{ item.name }}</div>
                        <div :class="`${prefix}-attachment-content-size`">
                            {{ `${getAttachmentType(item)} ${item.size}` }}
                        </div>
                    </div>
                    <Progress v-if="isUploadProgressVisible(item)" :aria-label="i18n.locale.uploadProgress" :class="`${prefix}-attachment-progress`" :percent="item.percent" :showInfo="false" type="circle" :width="30" />
                    <button :aria-label="i18n.locale.removeAttachment" :class="`${prefix}-attachment-delete`" :disabled="props.uploadProps?.disabled" type="button" @click="foundation.handleUploadFileDelete(item)">
                        <IconClose size="small" />
                    </button>
                </div>
            </HorizontalScroller>
            <slot v-if="props.topSlotPosition === 'bottom'" name="topSlot" v-bind="topSlotProps()" />
            <RichTextInput
                :id="editorId"
                ref="richText"
                :activeDescendant="listbox?.activeId"
                :controls="listbox?.id"
                :defaultContent="props.defaultContent"
                :extensions="props.extensions"
                :handleKeyDown="foundation.handleRichTextAreaKeyDown"
                :placeholder="placeholder"
                :showPlaceholderWhenSkillOnly="props.showPlaceholderWhenSkillOnly"
                @blur="foundation.handleBlur"
                @change="foundation.handleContentChange"
                @create="foundation.handleCreate"
                @focus="foundation.handleFocus"
                @keydown="foundation.handleKeyDown"
                @paste="(...args) => emit('paste', ...args)"
                @pasteFiles="foundation.handlePaste"
                @ready="onEditorReady"
            />
            <div :class="[`${prefix}-footer`, { [`${prefix}-footer-round`]: props.round }]">
                <div :class="`${prefix}-footer-configure`">
                    <Configure ref="configure" @change="foundation.onConfigureChange">
                        <slot name="configureArea" />
                    </Configure>
                    <!-- not a Configure item: templateVisible also changes on send and skill removal -->
                    <Button
                        v-if="props.showTemplateButton || state.skill?.hasTemplate"
                        :aria-pressed="state.templateVisible"
                        :class="[
                            `${prefix}-footer-configure-button`,
                            {
                                [`${prefix}-footer-configure-button-active`]: state.templateVisible,
                            },
                        ]"
                        theme="outline"
                        type="tertiary"
                        @click="foundation.changeTemplateVisible(!state.templateVisible)"
                    >
                        <template #icon>
                            <IconTemplateStroked />
                        </template>
                        {{ i18n.locale.template }}
                    </Button>
                </div>
                <slot v-if="$slots.actionArea" name="actionArea" v-bind="{ menuItem: actionNodes(), class: actionCls }" />
                <div v-else :class="actionCls">
                    <UploadButton ref="upload" v-bind="uploadButtonProps()" @change="foundation.onUploadChange">
                        <template v-if="$slots.uploadButton" #uploadButton="p">
                            <slot name="uploadButton" v-bind="p" />
                        </template>
                        <template v-if="$slots.uploadTip" #uploadTip>
                            <slot name="uploadTip" />
                        </template>
                    </UploadButton>
                    <SendButton :canSend="sendEnabled" :generating="props.generating" @click="onSendClick" />
                </div>
            </div>
        </div>
        <template #content>
            <div v-if="state.templateVisible" :class="[`${prefix}-template`, props.templatesCls]" :style="[{ maxHeight: `${numbers.TEMPLATE_MAX_HEIGHT}px` }, props.templatesStyle]">
                <slot name="template" :onTemplateClick="setContent" :skill="state.skill" />
            </div>
            <div v-else-if="state.skillVisible" :id="skillListId" ref="skillPanel" :aria-labelledby="editorId" :class="`${prefix}-skill`" role="listbox" :style="{ maxHeight: `${numbers.SKILL_MAX_HEIGHT}px` }">
                <template v-for="(item, index) in props.skills" :key="`${index}-${item.value}`">
                    <slot v-if="$slots.skillItem" name="skillItem" v-bind="skillOption(item, index)" />
                    <div v-else v-bind="optionAttrs('skill', index, () => foundation.handleSkillSelect(item))">
                        <slot :index="index" :item="item" name="skillIcon" />
                        <div :class="`${prefix}-skill-item-content`">{{ item.label }}</div>
                    </div>
                </template>
            </div>
            <div v-else-if="state.suggestionVisible" :id="suggestionListId" ref="suggestionPanel" :aria-labelledby="editorId" :class="`${prefix}-suggestion`" role="listbox" :style="{ maxHeight: `${numbers.SUGGESTION_MAX_HEIGHT}px` }">
                <!-- the index is part of the key: the same text may appear twice -->
                <template v-for="(item, index) in props.suggestions" :key="`${index}-${typeof item === 'string' ? item : item.content}`">
                    <slot v-if="$slots.suggestionItem" name="suggestionItem" v-bind="suggestionOption(item, index)" />
                    <div v-else v-bind="optionAttrs('suggestion', index, () => foundation.handleSuggestionSelect(item))">
                        {{ typeof item === 'string' ? item : item.content }}
                    </div>
                </template>
            </div>
        </template>
    </Popover>
</template>
