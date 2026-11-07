<script setup lang="ts">
    import { computed, type ComponentPublicInstance } from 'vue';
    import AvatarGroup from '../../avatar-group.vue';
    import Avatar from '../../avatar.vue';
    import type { AvatarGroupProps } from '../../interface';

    const props = withDefaults(defineProps<AvatarGroupProps & { custom?: boolean; explicitMoreSize?: string; values?: string[] }>(), { custom: false, values: () => ['LL', 'CX', 'RM', 'ZL', 'YZ'] });
    const emit = defineEmits<{ avatarRef: [value: string, instance: Element | ComponentPublicInstance | null] }>();
    const groupProps = computed(() => {
        const { custom: _custom, explicitMoreSize: _size, values: _values, ...rest } = props;
        return rest;
    });
</script>

<template>
    <AvatarGroup v-bind="groupProps">
        <Avatar v-for="value in values" :key="value" :ref="(instance) => emit('avatarRef', value, instance)" :alt="value" class="own" shape="circle" size="large">{{ value }}</Avatar>
        <template v-if="custom" #more="{ restNumber }">
            <div>
                <Avatar :size="explicitMoreSize">+{{ restNumber }}</Avatar>
            </div>
        </template>
    </AvatarGroup>
</template>
