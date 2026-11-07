<script setup lang="ts">
    import { computed } from 'vue';
    import Avatar from '../../avatar.vue';
    import type { AvatarProps } from '../../interface';

    const props = withDefaults(defineProps<AvatarProps & { label?: string; node?: boolean; hover?: string; top?: boolean; bottom?: boolean }>(), { label: 'Semi', node: false, hover: 'mask', top: false, bottom: false });
    const emit = defineEmits<{
        click: [event: MouseEvent];
    }>();
    const avatarProps = computed(() => {
        const { label: _label, node: _node, hover: _hover, top: _top, bottom: _bottom, ...rest } = props;
        return rest;
    });
</script>

<template>
    <Avatar v-bind="avatarProps" @click="emit('click', $event)">
        <b v-if="node">{{ label }}</b>
        <template v-else>{{ label }}</template>
        <template #hoverMask>{{ hover }}</template>
        <template v-if="top" #topSlotText>直播</template>
        <template v-if="bottom" #bottomSlotText>NEW</template>
    </Avatar>
</template>
