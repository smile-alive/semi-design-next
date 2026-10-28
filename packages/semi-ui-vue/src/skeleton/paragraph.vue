<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/skeleton/constants';
    import '@fibrae/semi-foundation/skeleton/skeleton.scss';
    import type { ElementProps } from '../_base/element-props';
    import type { SkeletonParagraphProps } from './interface';

    const props = withDefaults(defineProps<SkeletonParagraphProps & /* @vue-ignore */ ElementProps<'ul', keyof SkeletonParagraphProps>>(), { prefixCls: cssClasses.PREFIX, rows: 4 });

    // Array.from rounds a fractional count and yields no rows for NaN or a negative number, where a numeric v-for
    // would throw a RangeError.
    const rows = computed(() => Array.from({ length: props.rows }, (_, index) => index));
</script>

<template>
    <ul aria-hidden="true" :class="`${props.prefixCls}-paragraph`">
        <li v-for="row in rows" :key="row" />
    </ul>
</template>
