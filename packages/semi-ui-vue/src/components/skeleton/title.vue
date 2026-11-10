<script setup lang="ts">
    import type { ElementProps } from '../../base/index';
    import type { SkeletonBasicProps } from './interface';
    import SkeletonItem from './skeleton-item.vue';

    // A static subcomponent: it reads no global defaults. An explicit undefined type must not erase the built-in one.
    const props = withDefaults(defineProps<SkeletonBasicProps & /* @vue-ignore */ ElementProps<'div', keyof SkeletonBasicProps>>(), { type: undefined });
</script>

<template>
    <SkeletonItem :type="props.type ?? 'title'" />
</template>
