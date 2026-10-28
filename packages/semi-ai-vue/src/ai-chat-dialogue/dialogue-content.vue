<script setup lang="ts">
    import { computed, Fragment, h } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { isAwaitingOutput } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-content';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import DialogueContentBody from './dialogue-content-body.vue';
    import type { AIChatDialogueSlots, Metadata } from './interface';
    import useContentClass from './use-content-class';
    import ReferenceWidget from './widgets/content-item/reference.vue';

    type DialogueContentSlots = Pick<AIChatDialogueSlots, 'content' | 'contentItem' | 'messageText' | 'messageEdit'>;

    const props = defineProps<{ message: Message; role?: Metadata }>();
    const slots = defineSlots<DialogueContentSlots>();

    const locale = useLocale('AIChatDialogue');

    const wrapCls = useContentClass(() => props.message);

    const { PREFIX_CONTENT } = cssClasses;
    const { ROLE } = strings;
    const loading = computed(() => isAwaitingOutput(props.message));

    // Slots are not reactive, so this is read on each render. Without a #messageEdit slot nothing could render an editor,
    // and the message would show an empty body.
    const editing = () => Boolean(props.message.editing) && props.message.role === ROLE.USER && Boolean(slots.messageEdit);

    // The #content slot receives this node and the default branch renders it, so both show the same references and loading
    // indicator; the slots object forwards only the slots given, which DialogueContentBody reads for presence.
    const defaultContent = () =>
        h(Fragment, [
            props.message.references?.length && !editing() ? h(ReferenceWidget, { references: props.message.references }) : null,
            h(DialogueContentBody, { message: props.message, editing: editing() }, slots),
            loading.value
                ? h('span', { class: `${PREFIX_CONTENT}-loading` }, [
                      h('span', { class: `${PREFIX_CONTENT}-loading-item` }),
                      h('span', { class: `${PREFIX_CONTENT}-loading-item` }),
                      h('span', { class: `${PREFIX_CONTENT}-loading-item` }),
                      h('span', { class: `${PREFIX_CONTENT}-loading-text` }, locale.value.locale.loading),
                  ])
                : null,
        ]);
</script>

<template>
    <slot v-if="$slots.content" :class="wrapCls" :defaultContent="defaultContent()" :message="props.message" name="content" :role="props.role" />
    <div v-else :class="[PREFIX_CONTENT, { [`${PREFIX_CONTENT}-editing`]: editing() }]">
        <component :is="defaultContent()" />
    </div>
</template>
