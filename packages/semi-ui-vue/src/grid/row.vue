<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/grid/constants';
    import { gutterStyle, normalizeGutter } from '@fibrae/semi-foundation/grid/gutter';
    import { getRowClassName } from '@fibrae/semi-foundation/grid/utils';
    import '@fibrae/semi-foundation/grid/grid.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import type { RowProps, RowSlots } from './interface';

    const props = withDefaults(defineProps<RowProps & /* @vue-ignore */ ElementProps<'div', keyof RowProps>>(), {
        prefixCls: () => semiDefault('Row', 'prefixCls', cssClasses.PREFIX),
        type: semiGlobalDefault('Row', 'type'),
        align: semiGlobalDefault('Row', 'align'),
        justify: semiGlobalDefault('Row', 'justify'),
        gutter: () => semiDefault('Row', 'gutter', 0),
    });

    defineSlots<RowSlots>();

    const classes = computed(() => getRowClassName(props.prefixCls, props));

    const gutterVars = computed(() => {
        const [horizontal, vertical] = normalizeGutter(props.gutter);
        return { ...gutterStyle('x', horizontal), ...gutterStyle('y', vertical) };
    });
</script>

<template>
    <div :class="classes" :style="gutterVars" x-semi-prop="children">
        <slot />
    </div>
</template>
