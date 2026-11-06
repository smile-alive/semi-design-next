<script setup lang="ts">
    import { computed, h, useAttrs, useTemplateRef } from 'vue';
    import { cssClasses, isUnfinishedStatus } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import DialogueFoundation, { type DialogueAdapter, type DialogueState, type Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { followChats, followHints } from '@fibrae/semi-ai-foundation/message-list-foundation';
    import '@fibrae/semi-ai-foundation/ai-chat-dialogue/ai-chat-dialogue.scss';
    import { IconChevronDown } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import { groupRole } from '@fibrae/semi-ui-vue/_base/group-role';
    import { handOnSlots } from '@fibrae/semi-ui-vue/_base/hand-on';
    import semiDefault, { semiGlobalDefault } from '@fibrae/semi-ui-vue/_base/semi-default';
    import useFoundation from '@fibrae/semi-ui-vue/_base/use-foundation';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useFocusHandover, useLocale } from '@fibrae/semi-ui-vue/hooks';
    import { provideAIChatDialogueContext } from './context';
    import DialogueHint from './dialogue-hint.vue';
    import Dialogue from './dialogue.vue';
    import type { AIChatDialogueEmits, AIChatDialogueHandle, AIChatDialogueProps, AIChatDialogueSlots } from './interface';

    type Foundation = DialogueFoundation<AIChatDialogueProps>;
    type Adapter = DialogueAdapter<AIChatDialogueProps>;

    defineOptions({ name: 'AIChatDialogue' });

    const props = withDefaults(defineProps<AIChatDialogueProps & /* @vue-ignore */ ElementProps<'div', keyof AIChatDialogueProps | EmitHandlers<AIChatDialogueEmits>>>(), {
        align: () => semiDefault('AIChatDialogue', 'align', 'leftRight'),
        chats: semiGlobalDefault('AIChatDialogue', 'chats'),
        disabledFileItemClick: () => semiDefault('AIChatDialogue', 'disabledFileItemClick', false),
        escapeHtml: () => semiDefault('AIChatDialogue', 'escapeHtml', true),
        hintCls: semiGlobalDefault('AIChatDialogue', 'hintCls'),
        hints: semiGlobalDefault('AIChatDialogue', 'hints'),
        hintStyle: semiGlobalDefault('AIChatDialogue', 'hintStyle'),
        markdownRenderProps: semiGlobalDefault('AIChatDialogue', 'markdownRenderProps'),
        mode: () => semiDefault('AIChatDialogue', 'mode', 'bubble'),
        selecting: () => semiDefault('AIChatDialogue', 'selecting', false),
        showReference: () => semiDefault('AIChatDialogue', 'showReference', false),
        showReset: () => semiDefault('AIChatDialogue', 'showReset', true),
    });

    const emit = defineEmits<AIChatDialogueEmits>();
    const slots = defineSlots<AIChatDialogueSlots>();
    const attrs = useAttrs();

    const locale = useLocale('AIChatDialogue');

    const list = useTemplateRef('list');

    const prefix = cssClasses.PREFIX;
    const EMPTY_CHATS: Message[] = [];
    const EMPTY_HINTS: string[] = [];
    const followedChats = computed(() => followChats(props.chats));
    const followedHints = computed(() => followHints(props.hints));

    const { foundation, state } = useFoundation<Foundation, Adapter, AIChatDialogueProps, DialogueState>(
        DialogueFoundation,
        props,
        () => DialogueFoundation.getInitialState(),
        () => ({
            getContainerRef: () => list.value as HTMLDivElement,
            notifySelect: (ids: string[]) => emit('select', ids),
            // a followed copy stands for the list the parent already holds, so it is reported as that list
            notifyChatsChange: (next: Message[]) => {
                const list = next === followedChats.value ? chats.value : next;
                emit('update:chats', list);
                emit('chatsChange', list);
            },
            notifyLikeMessage: (message: Message) => emit('messageGoodFeedback', message),
            notifyDislikeMessage: (message: Message) => emit('messageBadFeedback', message),
            notifyEditMessage: (message: Message) => emit('messageEdit', message),
            notifyMessageDelete: (message: Message) => emit('messageDelete', message),
            notifyMessageReset: (message: Message) => emit('messageReset', message),
            notifyHintClick: (hint: string) => emit('hintClick', hint),
        }),
        { props: { chats: () => followedChats.value, hints: () => followedHints.value } }
    );

    // the button unmounts once the list is at the bottom; focus moves to the list instead of falling to the body
    const handoverBackBottomFocus = useFocusHandover(() => list.value);

    const chats = computed(() => props.chats ?? EMPTY_CHATS);
    const hints = computed(() => props.hints ?? EMPTY_HINTS);

    // a busy log defers announcements, so a streamed reply is read once it settles
    const streaming = computed(() => isUnfinishedStatus(chats.value.at(-1)?.status));

    provideAIChatDialogueContext({
        view: computed(() => ({
            align: props.align,
            disabledFileItemClick: props.disabledFileItemClick,
            escapeHtml: props.escapeHtml,
            markdownRenderProps: props.markdownRenderProps,
            mode: props.mode,
            selecting: props.selecting,
            showReference: props.showReference,
            showReset: props.showReset,
        })),
        selectChange: foundation.handleSelectOrRemove,
        annotationClick: (annotations) => emit('annotationClick', annotations),
        fileClick: (file) => emit('fileClick', file),
        imageClick: (image) => emit('imageClick', image),
        referenceClick: (item) => emit('referenceClick', item),
        messageCopy: (message) => emit('messageCopy', message),
        messageShare: (message) => emit('messageShare', message),
        messageGoodFeedback: foundation.likeMessage,
        messageBadFeedback: foundation.dislikeMessage,
        messageReset: foundation.resetMessage,
        messageEdit: foundation.editMessage,
        messageDelete: foundation.deleteMessage,
    });

    // Dialogue reads only its own slot names. Passing the slots object forwards every given slot without the ref_for that a
    // dynamic slot outlet inside the list v-for compiles to.
    const dialogueNode = (chat: Message, index: number) => h(Dialogue, { isLastChat: index === chats.value.length - 1, isSelected: state.value.selectedIds.has(chat.id), message: chat, role: props.roleConfig[chat.role] }, handOnSlots(slots));

    defineExpose<AIChatDialogueHandle>({
        selectAll: foundation.handleSelectAll,
        deselectAll: foundation.handleDeselectAll,
        scrollToBottom: foundation.scrollToBottom,
        scrollToTop: foundation.scrollToTop,
    });
</script>

<template>
    <div :class="prefix" :role="groupRole(attrs)">
        <div ref="list" :aria-busy="streaming" :aria-label="locale.locale.messages" :class="`${prefix}-list`" role="log" tabindex="-1" @scroll="foundation.containerScroll">
            <component :is="dialogueNode(chat, index)" v-for="(chat, index) in chats" :key="chat.id" />
            <DialogueHint v-if="hints.length > 0" :class="props.hintCls" :hints="hints" :selecting="props.selecting" :style="props.hintStyle" @hintClick="foundation.onHintClick">
                <template v-if="$slots.hintBox" #hintBox="slotProps">
                    <slot name="hintBox" v-bind="slotProps" />
                </template>
            </DialogueHint>
        </div>
        <span v-if="state.backBottomVisible" :ref="handoverBackBottomFocus" :class="`${prefix}-backBottom`">
            <Button :aria-label="locale.locale.backToBottom" :class="`${prefix}-backBottom-button`" type="tertiary" @click="foundation.scrollToBottomWithAnimation">
                <template #icon>
                    <IconChevronDown size="extra-large" />
                </template>
            </Button>
        </span>
    </div>
</template>
