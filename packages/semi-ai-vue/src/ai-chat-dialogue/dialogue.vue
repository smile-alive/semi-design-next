<script setup lang="ts">
    import { computed, h, normalizeClass } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import Checkbox from '@fibrae/semi-ui-vue/checkbox/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import { useAIChatDialogueContext } from './context';
    import DialogueAction from './dialogue-action.vue';
    import DialogueAvatar from './dialogue-avatar.vue';
    import DialogueContent from './dialogue-content.vue';
    import DialogueTitle from './dialogue-title.vue';
    import type { AIChatDialogueSlots, FullDialogueNodes, Metadata } from './interface';

    const props = defineProps<{
        message: Message;
        role?: Metadata | Map<string, Metadata>;
        isLastChat: boolean;
        isSelected: boolean;
    }>();

    const slots = defineSlots<Pick<AIChatDialogueSlots, 'avatar' | 'title' | 'content' | 'action' | 'fullDialogue' | 'contentItem' | 'messageText' | 'messageEdit'>>();

    const { view, selectChange } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const prefix = cssClasses.PREFIX;
    const { ROLE, DIALOGUE_ALIGN } = strings;

    const roleInfo = computed(() => {
        const { role, message } = props;
        return role instanceof Map ? role.get(message.name ?? '') : role;
    });

    const containerCls = computed(() =>
        normalizeClass([
            `${prefix}-container`,
            {
                [`${prefix}-container-right`]: props.message.role === ROLE.USER && view.value.align === DIALOGUE_ALIGN.LEFT_RIGHT,
            },
        ])
    );

    const contentKey = () => (props.message.editing ? 'editing' : 'view');

    // #fullDialogue receives these nodes and the default branch renders them. Each part reads only its own slot names, so
    // the whole slots object is passed; it holds only the slots given, which each part reads for presence.
    const fullNodes = (): FullDialogueNodes => {
        const { message } = props;
        const role = roleInfo.value;
        return {
            avatar: h(DialogueAvatar, { message, role }, slots),
            title: h(DialogueTitle, { message, role }, slots),
            content: h(DialogueContent, { key: contentKey(), message, role }, slots),
            action: h(DialogueAction, { isLastChat: props.isLastChat, message }, slots),
        };
    };
</script>

<template>
    <div
        :class="[
            `${prefix}-wrapper`,
            {
                [`${prefix}-wrapper-selected`]: view.selecting && props.isSelected,
            },
        ]"
    >
        <div v-if="view.selecting" :class="`${prefix}-checkbox`">
            <Checkbox :aria-label="locale.locale.selectMessage" :modelValue="props.isSelected" @change="selectChange($event.target.checked, props.message.id)" />
        </div>
        <slot v-if="$slots.fullDialogue" :class="containerCls" :defaultNodes="fullNodes()" :message="props.message" name="fullDialogue" :role="roleInfo" />
        <div v-for="(nodes, i) in [fullNodes()]" v-else :key="i" :class="containerCls">
            <component :is="nodes.avatar" />
            <div :class="`${prefix}-inner`">
                <component :is="nodes.title" />
                <component :is="nodes.content" />
                <component :is="nodes.action" />
            </div>
        </div>
    </div>
</template>
