<script setup lang="ts">
    import type { ElementProps } from '../_base/element-props';
    import type { SkeletonBasicProps } from './interface';
    import SkeletonItem from './skeleton-item.vue';

    // A static subcomponent: it reads no global defaults. An explicit undefined type must not erase the built-in one.
    const props = withDefaults(defineProps<SkeletonBasicProps & /* @vue-ignore */ ElementProps<'div', keyof SkeletonBasicProps>>(), { prefixCls: undefined, type: undefined });
</script>

<template>
    <SkeletonItem :prefixCls="props.prefixCls" :type="props.type ?? 'image'" />
</template>
