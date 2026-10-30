<script setup lang="ts">
    import { computed, h, useAttrs, useTemplateRef } from 'vue';
    import { cssClasses, isUnfinishedStatus } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import DialogueFoundation, { type DialogueAdapter, type Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import '@fibrae/semi-ai-foundation/ai-chat-dialogue/ai-chat-dialogue.scss';
    import { IconChevronDown } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import { groupRole } from '@fibrae/semi-ui-vue/_base/group-role';
    import semiDefault, { semiGlobalDefault } from '@fibrae/semi-ui-vue/_base/semi-default';
    import useFoundation from '@fibrae/semi-ui-vue/_base/use-foundation';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useDidUpdate, useFocusHandover, useLocale } from '@fibrae/semi-ui-vue/hooks';
    import { provideAIChatDialogueContext } from './context';
    import DialogueHint from './dialogue-hint.vue';
    import Dialogue from './dialogue.vue';
    import type { AIChatDialogueEmits, AIChatDialogueHandle, AIChatDialogueProps, AIChatDialogueSlots } from './interface';

    interface AIChatDialogueStates {
        selectedIds: Set<string>;
        backBottomVisible: boolean;
    }

    type Foundation = DialogueFoundation<AIChatDialogueProps, AIChatDialogueStates>;
    type Adapter = DialogueAdapter<AIChatDialogueProps, AIChatDialogueStates>;

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

    const { foundation, state } = useFoundation<Foundation, Adapter, AIChatDialogueProps, AIChatDialogueStates>(
        DialogueFoundation,
        props,
        () => ({ selectedIds: new Set<string>(), backBottomVisible: false }),
        (base) => ({
            getContainerRef: () => list.value as HTMLDivElement,
            updateSelected: (ids: Set<string>) => base.setState({ selectedIds: ids }),
            notifySelect: (ids: string[]) => emit('select', ids),
            notifyChatsChange: (chats: Message[]) => {
                emit('update:chats', chats);
                emit('chatsChange', chats);
            },
            notifyLikeMessage: (message: Message) => emit('messageGoodFeedback', message),
            notifyDislikeMessage: (message: Message) => emit('messageBadFeedback', message),
            notifyEditMessage: (message: Message) => emit('messageEdit', message),
            notifyMessageDelete: (message: Message) => emit('messageDelete', message),
            notifyMessageReset: (message: Message) => emit('messageReset', message),
            notifyHintClick: (hint: string) => emit('hintClick', hint),
            setBackBottomVisible: (visible: boolean) => base.setState({ backBottomVisible: visible }),
        })
    );

    // the button unmounts once the list is at the bottom; focus moves to the list instead of falling to the body
    const handoverBackBottomFocus = useFocusHandover(() => list.value);

    const EMPTY_HINTS: string[] = [];
    const chats = computed(() => props.chats ?? EMPTY_CHATS);
    const hints = computed(() => props.hints ?? EMPTY_HINTS);

    let snapshot = { chats: [...chats.value], hints: [...hints.value] };

    // a busy log defers announcements, so a streamed reply is read once it settles
    const streaming = computed(() => isUnfinishedStatus(chats.value.at(-1)?.status));
    const CHATS_PART = 5;

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
    const dialogueNode = (chat: Message, index: number) => h(Dialogue, { isLastChat: index === chats.value.length - 1, isSelected: state.value.selectedIds.has(chat.id), message: chat, role: props.roleConfig[chat.role] }, { ...slots });

    // A Vue caller also pushes messages and appends to the last message's text in place, so the list is compared by what
    // those edits change. Known limitation: other in-place edits (deep content text, a lone status flip) re-render but are
    // not reported or followed, as the snapshot shares message objects; upgrade when such an edit needs following.
    const listKey = () => {
        const list = chats.value;
        const last = list.at(-1);
        const content = last?.content;
        return [list, list.length, last?.id, content, content?.length, hints.value, hints.value.length] as const;
    };

    useDidUpdate(
        listKey,
        (next, previous) => {
            const changed = (from: number, to: number) => next.slice(from, to).some((v, i) => v !== previous[from + i]);
            const current = { chats: chats.value, hints: hints.value };
            // an unchanged part is passed as the same array, so the foundation does not report it as new
            foundation.handleListUpdate(
                {
                    chats: changed(0, CHATS_PART) ? snapshot.chats : current.chats,
                    hints: changed(CHATS_PART, next.length) ? snapshot.hints : current.hints,
                },
                current
            );
            snapshot = { chats: [...current.chats], hints: [...current.hints] };
        },
        (a, b) => a.every((v, i) => v === b[i])
    );

    defineExpose<AIChatDialogueHandle>({
        selectAll: foundation.handleSelectAll,
        deselectAll: foundation.handleDeselectAll,
        scrollToBottom: (animation) => {
            if (animation) {
                foundation.scrollToBottomWithAnimation();
            } else {
                foundation.scrollToBottomImmediately();
            }
        },
        scrollToTop: (animation) => {
            if (animation) {
                foundation.scrollToTopWithAnimation();
            } else {
                foundation.scrollToTopImmediately();
            }
        },
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
