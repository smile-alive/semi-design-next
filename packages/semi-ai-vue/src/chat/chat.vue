<script setup lang="ts">
    import { computed, h, useTemplateRef, watch } from 'vue';
    import { cssClasses, isUnfinishedMessageStatus, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import ChatFoundation, { type ChatAdapter } from '@fibrae/semi-ai-foundation/chat/foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-ai-foundation/chat/chat.scss';
    import { IconChevronDown, IconDisc } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import { groupRole } from '@fibrae/semi-ui-vue/_base/group-role';
    import semiDefault, { semiGlobalDefault } from '@fibrae/semi-ui-vue/_base/semi-default';
    import useFoundation from '@fibrae/semi-ui-vue/_base/use-foundation';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import Divider from '@fibrae/semi-ui-vue/divider/index';
    import { useLocale, useResizeObserver } from '@fibrae/semi-ui-vue/hooks';
    import Toast from '@fibrae/semi-ui-vue/toast/index';
    import ChatBox from './chat-box.vue';
    import { provideChatContext } from './context';
    import Hint from './hint.vue';
    import InputBox from './input-box.vue';
    import type { ChatEmits, ChatHandle, ChatMessage, ChatProps, ChatSlots } from './interface';

    interface ChatState {
        backBottomVisible: boolean;
        uploadAreaVisible: boolean;
    }

    type Foundation = ChatFoundation<ChatProps, ChatState>;
    type Adapter = ChatAdapter<ChatProps, ChatState>;

    defineOptions({ name: 'Chat' });

    const props = withDefaults(defineProps<ChatProps & /* @vue-ignore */ ElementProps<'div', keyof ChatProps | EmitHandlers<ChatEmits>>>(), {
        align: () => semiDefault('Chat', 'align', 'leftRight'),
        canSend: semiGlobalDefault('Chat', 'canSend'),
        chats: semiGlobalDefault('Chat', 'chats'),
        customMarkDownComponents: semiGlobalDefault('Chat', 'customMarkDownComponents'),
        enableUpload: () => semiDefault('Chat', 'enableUpload', true),
        escapeHtml: () => semiDefault('Chat', 'escapeHtml', true),
        hintCls: semiGlobalDefault('Chat', 'hintCls'),
        hints: semiGlobalDefault('Chat', 'hints'),
        hintStyle: semiGlobalDefault('Chat', 'hintStyle'),
        inputBoxCls: semiGlobalDefault('Chat', 'inputBoxCls'),
        inputBoxStyle: semiGlobalDefault('Chat', 'inputBoxStyle'),
        markdownRenderProps: semiGlobalDefault('Chat', 'markdownRenderProps'),
        mode: () => semiDefault('Chat', 'mode', 'bubble'),
        placeholder: semiGlobalDefault('Chat', 'placeholder'),
        roleConfig: semiGlobalDefault('Chat', 'roleConfig'),
        sendHotKey: () => semiDefault('Chat', 'sendHotKey', 'enter'),
        showClearContext: () => semiDefault('Chat', 'showClearContext', false),
        showStopGenerate: () => semiDefault('Chat', 'showStopGenerate', false),
        uploadProps: semiGlobalDefault('Chat', 'uploadProps'),
        uploadTipProps: semiGlobalDefault('Chat', 'uploadTipProps'),
    });

    const emit = defineEmits<ChatEmits>();
    const slots = defineSlots<ChatSlots>();

    const i18n = useLocale('Chat');

    const container = useTemplateRef('container');
    const dropArea = useTemplateRef('dropArea');
    const stop = useTemplateRef('stop');
    const backBottom = useTemplateRef('backBottom');
    const inputBox = useTemplateRef('inputBox');

    const { PREFIX, PREFIX_DIVIDER } = cssClasses;
    const { ROLE } = strings;
    const EMPTY_CHATS: ChatMessage[] = [];

    const { foundation, state } = useFoundation<Foundation, Adapter, ChatProps, ChatState>(
        ChatFoundation,
        props,
        () => ({ backBottomVisible: false, uploadAreaVisible: false }),
        (base) => ({
            getContainerRef: () => container.value as HTMLDivElement,
            notifyChatsChange: (chats) => {
                emit('update:chats', chats);
                emit('chatsChange', chats);
            },
            notifyLikeMessage: (message) => emit('messageGoodFeedback', message),
            notifyDislikeMessage: (message) => emit('messageBadFeedback', message),
            notifyMessageDelete: (message) => emit('messageDelete', message),
            notifyMessageReset: (message) => emit('messageReset', message),
            notifyClearContext: () => emit('clear'),
            notifyMessageSend: (content, attachment) => emit('messageSend', content, attachment),
            notifyInputChange: (value) => emit('inputChange', value),
            setBackBottomVisible: (visible) => {
                if (base.getState('backBottomVisible') !== visible) {
                    base.setState({ backBottomVisible: visible });
                }
            },
            notifyStopGenerate: (e) => emit('stopGenerator', e),
            notifyHintClick: (hint) => emit('hintClick', hint),
            setUploadAreaVisible: (visible) => base.setState({ uploadAreaVisible: visible }),
            manualUpload: (files) => inputBox.value?.insertFiles(files),
            getDropAreaElement: () => dropArea.value as HTMLDivElement,
        })
    );

    const chats = computed(() => props.chats ?? EMPTY_CHATS);

    // a busy log defers announcements, so a streamed reply is read once it settles
    const streaming = computed(() => isUnfinishedMessageStatus(chats.value.at(-1)?.status));
    const generating = computed(() => props.showStopGenerate && streaming.value);
    const upload = computed(() => ChatFoundation.getUploadProps(props.enableUpload, props.uploadProps?.disabled));
    const showBackBottom = computed(() => state.value.backBottomVisible && !generating.value);

    // ChatBox reads only its own slot names. Passing the slots object forwards every given slot without the ref_for that a
    // dynamic slot outlet inside the message v-for compiles to.
    const chatBoxNode = (item: ChatMessage, index: number) => h(ChatBox, { continueSend: index > 0 && item.role === chats.value[index - 1].role, isLast: index === chats.value.length - 1, message: item }, { ...slots });

    const onDragOver = (e: DragEvent) => {
        if (upload.value.dragUpload) {
            foundation.handleDragOver(e);
        }
    };

    const onDragStart = () => {
        if (upload.value.dragUpload) {
            foundation.handleDragStart();
        }
    };

    const onDragEnd = () => {
        if (upload.value.dragUpload) {
            foundation.handleDragEnd();
        }
    };

    // Known limitation: only a replaced list counts as a change; pushing into the same array is not followed
    watch(
        () => props.chats,
        (chats, prevChats) => foundation.handleChatsChange(chats ?? EMPTY_CHATS, prevChats ?? EMPTY_CHATS),
        { flush: 'post' }
    );

    watch(
        () => props.hints,
        (hints, prevHints) => foundation.handleHintsChange(hints ?? [], prevHints ?? []),
        { flush: 'post' }
    );

    useResizeObserver(container, foundation.handleScrollContainerResize);

    // The stop and back-to-bottom buttons go away on their own; focus moves to the input instead of falling to the body
    watch(
        [generating, showBackBottom],
        ([isGenerating, isBackBottom]) => {
            const leaving = [isGenerating ? null : stop.value, isBackBottom ? null : backBottom.value];
            if (leaving.some((el) => el?.contains(FocusTrapHandle.getActiveElement(el)))) {
                inputBox.value?.focusInput();
            }
        },
        { flush: 'pre' }
    );

    const [toast, Holder] = Toast.useToast();

    provideChatContext({
        view: computed(() => ({
            align: props.align,
            customMarkDownComponents: props.customMarkDownComponents,
            escapeHtml: props.escapeHtml,
            markdownRenderProps: props.markdownRenderProps,
            mode: props.mode,
            roleConfig: props.roleConfig,
        })),
        toast,
        likeMessage: foundation.likeMessage,
        dislikeMessage: foundation.dislikeMessage,
        resetMessage: foundation.resetMessage,
        deleteMessage: foundation.deleteMessage,
        copyMessage: (message) => emit('messageCopy', message),
    });

    defineExpose<ChatHandle>({
        // no message started this reset, so messageReset reports null
        resetMessage: () => foundation.resetMessage(null),
        clearContext: () => foundation.clearContext(null),
        scrollToBottom: (animation) => {
            if (animation) {
                foundation.scrollToBottomWithAnimation();
            } else {
                foundation.scrollToBottomImmediately();
            }
        },
        sendMessage: (content, attachment) => foundation.onMessageSend(content, attachment),
    });
</script>

<template>
    <div :class="PREFIX" :role="groupRole($attrs)" @dragend="onDragEnd" @dragover="onDragOver" @dragstart="onDragStart">
        <div v-if="upload.dragUpload && state.uploadAreaVisible" ref="dropArea" :class="`${PREFIX}-dropArea`" @dragleave="foundation.handleContainerDragLeave" @dragover="foundation.handleContainerDragOver" @drop="foundation.handleContainerDrop">
            <span :class="`${PREFIX}-dropArea-text`">{{ i18n.locale.dropAreaText }}</span>
        </div>
        <div :class="`${PREFIX}-inner`">
            <slot name="topSlot" />
            <div :class="`${PREFIX}-content`">
                <div ref="container" :aria-busy="streaming" :aria-label="i18n.locale.messages" :class="`${PREFIX}-container`" role="log" tabindex="-1" @scroll="foundation.containerScroll($event)">
                    <template v-for="(item, index) in chats" :key="item.id">
                        <template v-if="item.role === ROLE.DIVIDER">
                            <slot v-if="$slots.divider" :message="item" name="divider" />
                            <Divider v-else :class="PREFIX_DIVIDER">{{ i18n.locale.clearContext }}</Divider>
                        </template>
                        <component :is="chatBoxNode(item, index)" v-else />
                    </template>
                    <Hint v-if="props.hints?.length" :class="props.hintCls" :hints="props.hints" :style="props.hintStyle" @hintClick="foundation.onHintClick">
                        <template v-if="$slots.hintBox" #hintBox="p">
                            <slot name="hintBox" v-bind="p" />
                        </template>
                    </Hint>
                </div>
                <!-- outside the log: a toast inside it would be announced as one more log entry -->
                <div :class="`${PREFIX}-toast`"><Holder /></div>
            </div>
            <span v-if="showBackBottom" ref="backBottom" :class="`${PREFIX}-action`">
                <Button :aria-label="i18n.locale.backToBottom" :class="[`${PREFIX}-action-content`, `${PREFIX}-action-backBottom`]" type="tertiary" @click="foundation.scrollToBottomWithAnimation">
                    <template #icon>
                        <IconChevronDown size="extra-large" />
                    </template>
                </Button>
            </span>
            <span v-if="generating" ref="stop" :class="`${PREFIX}-action`">
                <Button :class="[`${PREFIX}-action-content`, `${PREFIX}-action-stop`]" type="tertiary" @click="foundation.stopGenerate">
                    <template #icon>
                        <IconDisc size="extra-large" />
                    </template>
                    {{ i18n.locale.stop }}
                </Button>
            </span>
            <InputBox
                ref="inputBox"
                :canSend="props.canSend"
                :clickUpload="upload.clickUpload"
                :disableSend="generating"
                :dragUpload="upload.dragUpload"
                :inputBoxCls="props.inputBoxCls"
                :inputBoxStyle="props.inputBoxStyle"
                :pasteUpload="upload.pasteUpload"
                :placeholder="props.placeholder"
                :sendHotKey="props.sendHotKey"
                :showClearContext="props.showClearContext"
                :uploadProps="props.uploadProps"
                :uploadTipProps="props.uploadTipProps"
                @clear="foundation.clearContext(null)"
                @inputChange="foundation.onInputChange"
                @send="foundation.onMessageSend"
            >
                <template v-if="$slots.inputArea" #inputArea="p">
                    <slot name="inputArea" v-bind="p" />
                </template>
                <template v-if="$slots.uploadButton" #uploadButton>
                    <slot name="uploadButton" />
                </template>
                <template v-if="$slots.uploadTip" #uploadTip>
                    <slot name="uploadTip" />
                </template>
            </InputBox>
            <slot name="bottomSlot" />
        </div>
    </div>
</template>
