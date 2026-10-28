<script setup lang="ts">
    import { computed, h } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import Avatar from '@fibrae/semi-ui-vue/avatar/index';
    import type { ChatMessage, ChatMetadata, ChatSlots } from './interface';

    const props = defineProps<{ message: ChatMessage; role: ChatMetadata; continueSend: boolean }>();
    const slots = defineSlots<Pick<ChatSlots, 'avatar' | 'roleAvatar'>>();

    const { PREFIX_CHAT_BOX } = cssClasses;

    const avatarProps = computed(() => ({
        class: [`${PREFIX_CHAT_BOX}-avatar`, { [`${PREFIX_CHAT_BOX}-avatar-hidden`]: props.continueSend }],
        // the title next to it names the sender
        alt: '',
        color: props.role.color,
        size: 'extra-small' as const,
        src: props.role.avatar,
    }));

    const defaultAvatar = () => h(Avatar, avatarProps.value, slots.roleAvatar && { default: () => slots.roleAvatar?.({ role: props.role, message: props.message }) });
</script>

<template>
    <slot v-if="$slots.avatar" :defaultAvatar="defaultAvatar()" :message="props.message" name="avatar" :role="props.role" />
    <Avatar v-else v-bind="avatarProps">
        <template v-if="$slots.roleAvatar" #default>
            <slot :message="props.message" name="roleAvatar" :role="props.role" />
        </template>
    </Avatar>
</template>
