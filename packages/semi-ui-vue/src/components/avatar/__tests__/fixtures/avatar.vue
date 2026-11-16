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
        <b v-if="props.node">{{ props.label }}</b>
        <template v-else>{{ props.label }}</template>
        <template #hoverMask>{{ props.hover }}</template>
        <template v-if="props.top" #topSlotText>直播</template>
        <template v-if="props.bottom" #bottomSlotText>NEW</template>
    </Avatar>
</template>
