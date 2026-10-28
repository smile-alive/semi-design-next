<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/grid/constants';
    import { getColClassName } from '@fibrae/semi-foundation/grid/utils';
    import '@fibrae/semi-foundation/grid/grid.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import type { ColProps, ColSlots } from './interface';

    const props = withDefaults(defineProps<ColProps & /* @vue-ignore */ ElementProps<'div', keyof ColProps>>(), {
        prefixCls: () => semiDefault('Col', 'prefixCls', cssClasses.PREFIX),
        span: semiGlobalDefault('Col', 'span'),
        order: semiGlobalDefault('Col', 'order'),
        offset: semiGlobalDefault('Col', 'offset'),
        push: semiGlobalDefault('Col', 'push'),
        pull: semiGlobalDefault('Col', 'pull'),
        xs: semiGlobalDefault('Col', 'xs'),
        sm: semiGlobalDefault('Col', 'sm'),
        md: semiGlobalDefault('Col', 'md'),
        lg: semiGlobalDefault('Col', 'lg'),
        xl: semiGlobalDefault('Col', 'xl'),
        xxl: semiGlobalDefault('Col', 'xxl'),
    });

    defineSlots<ColSlots>();

    const classes = computed(() => getColClassName(props.prefixCls, props));
</script>

<template>
    <div :class="classes" x-semi-prop="children">
        <slot />
    </div>
</template>
