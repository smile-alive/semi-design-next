<script setup lang="ts">
    import { computed, h } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import Avatar from '@fibrae/semi-ui-vue/avatar/index';
    import type { AIChatDialogueSlots, Metadata } from './interface';

    const props = withDefaults(defineProps<{ message: Message; role?: Metadata; continueSend?: boolean }>(), {
        continueSend: false,
    });

    defineSlots<Pick<AIChatDialogueSlots, 'avatar'>>();

    const prefix = cssClasses.PREFIX;

    const avatarProps = computed(() => ({
        class: [`${prefix}-avatar`, { [`${prefix}-avatar-hidden`]: props.continueSend }],
        // alt names the sender only in a continued run, where the title beside it is not shown
        alt: props.continueSend ? (props.role?.name ?? '') : '',
        color: props.role?.color,
        size: 'extra-small',
        src: props.role?.avatar,
    }));

    const defaultAvatar = () => h(Avatar, avatarProps.value);
</script>

<template>
    <slot v-if="$slots.avatar" :defaultAvatar="defaultAvatar()" :message="props.message" name="avatar" :role="props.role" />
    <Avatar v-else v-bind="avatarProps" />
</template>
