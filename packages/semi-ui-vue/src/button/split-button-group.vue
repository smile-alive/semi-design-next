<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/button/constants';
    import { markEnds } from '@fibrae/semi-foundation/button/utils';
    import '@fibrae/semi-foundation/button/button.scss';
    import type { ElementProps } from '../_base/element-props';
    import useMutationObserver from '../_base/use-mutation-observer';
    import type { SplitButtonGroupProps, SplitButtonGroupSlots } from './interface';

    defineOptions({ inheritAttrs: false });
    defineProps<SplitButtonGroupProps & /* @vue-ignore */ ElementProps<'div', keyof SplitButtonGroupProps>>();
    defineSlots<SplitButtonGroupSlots>();

    const root = useTemplateRef('root');

    const prefix = cssClasses.PREFIX;

    // A re-render can replace a button's class, so mark again whenever classes or buttons change; no records is the
    // initial run.
    useMutationObserver(
        root,
        (mutations) => {
            const changed = !mutations.length || mutations.some((mutation) => mutation.type === 'childList' || (mutation.type === 'attributes' && mutation.attributeName === 'class'));
            if (changed && root.value) markEnds(root.value);
        },
        { attributes: true, childList: true, subtree: true }
    );
</script>

<template>
    <div ref="root" v-bind="$attrs" :class="`${prefix}-split`" role="group">
        <slot />
    </div>
</template>
