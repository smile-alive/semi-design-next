<script setup lang="ts">
    import { onMounted, onUpdated, useTemplateRef } from 'vue';
    import Avatar from '../../avatar.vue';
    import type { AvatarProps } from '../../interface';

    withDefaults(defineProps<{ alt?: string; border?: AvatarProps['border']; top?: boolean }>(), { top: false });
    const emit = defineEmits<{ root: [element: Element]; click: [event: MouseEvent] }>();
    const avatar = useTemplateRef('avatar');
    const notifyRoot = () => emit('root', avatar.value?.$el);
    onMounted(notifyRoot);
    onUpdated(notifyRoot);
</script>

<template>
    <Avatar ref="avatar" :alt="alt" :border="border" @click="emit('click', $event)">
        U
        <template #hoverMask>mask</template>
        <template v-if="top" #topSlotText>直播</template>
    </Avatar>
</template>
