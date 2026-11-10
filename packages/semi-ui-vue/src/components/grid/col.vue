<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/grid/constants';
    import { getColClassName, getColStyle } from '@fibrae/semi-foundation/components/grid/utils';
    import '@fibrae/semi-foundation/components/grid/grid.scss';
    import type { ElementProps } from '../../base/element-props';
    import { semiGlobalDefault } from '../../base/semi-default';
    import type { ColProps, ColSlots } from './interface';

    const props = withDefaults(defineProps<ColProps & /* @vue-ignore */ ElementProps<'div', keyof ColProps>>(), {
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

    const colVars = computed(() => getColStyle(props));
</script>

<template>
    <div :class="getColClassName(cssClasses.PREFIX)" :style="colVars" x-semi-prop="children">
        <slot />
    </div>
</template>
