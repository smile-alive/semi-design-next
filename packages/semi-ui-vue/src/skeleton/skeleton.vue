<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/skeleton/constants';
    import '@fibrae/semi-foundation/skeleton/skeleton.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import type { SkeletonProps, SkeletonSlots } from './interface';

    // The root is absent once loading ends, so attrs are bound by hand and are dropped together with the placeholder.
    // In the template aria-busy follows the attrs, so a caller cannot switch it off.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<SkeletonProps & /* @vue-ignore */ ElementProps<'div', keyof SkeletonProps>>(), {
        loading: () => semiDefault('Skeleton', 'loading', true),
        active: semiGlobalDefault('Skeleton', 'active'),
    });

    defineSlots<SkeletonSlots>();

    const prefixCls = cssClasses.PREFIX;
</script>

<template>
    <div v-if="props.loading" v-bind="$attrs" aria-busy="true" :class="[prefixCls, { [`${prefixCls}-active`]: props.active }]" x-semi-prop="placeholder">
        <slot name="placeholder" />
    </div>
    <slot v-else />
</template>
