<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/skeleton/constants';
    import '@fibrae/semi-foundation/components/skeleton/skeleton.scss';
    import type { SkeletonAvatarProps } from './interface';

    interface SkeletonItemProps extends SkeletonAvatarProps {
        type: string;
    }

    // The shared block behind Avatar, Image, Title and Button: a template cannot yield one component per default type.
    const props = withDefaults(defineProps<SkeletonItemProps>(), {
        size: 'medium',
        shape: 'circle',
    });

    const itemClass = computed(() => {
        const base = `${cssClasses.PREFIX}-${props.type}`;
        const avatar = props.type.toUpperCase() === 'AVATAR';
        return [base, { [`${base}-${props.size}`]: avatar, [`${base}-${props.shape}`]: avatar }];
    });
</script>

<template>
    <div aria-hidden="true" :class="itemClass" />
</template>
