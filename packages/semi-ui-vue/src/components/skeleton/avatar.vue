<script setup lang="ts">
    import type { ElementProps } from '../../base/index';
    import type { SkeletonAvatarProps } from './interface';
    import SkeletonItem from './skeleton-item.vue';

    // A static subcomponent: it reads no global defaults. An explicit undefined type must not erase the built-in one.
    const props = withDefaults(defineProps<SkeletonAvatarProps & /* @vue-ignore */ ElementProps<'div', keyof SkeletonAvatarProps>>(), {
        type: undefined,
        size: 'medium',
        shape: 'circle',
    });
</script>

<template>
    <SkeletonItem :shape="props.shape" :size="props.size" :type="props.type ?? 'avatar'" />
</template>
