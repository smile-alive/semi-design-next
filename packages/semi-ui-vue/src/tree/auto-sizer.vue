<script setup lang="ts">
    import { shallowRef, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import useResizeObserver from '../_base/use-resize-observer';
    import type { AutoSizerProps } from './interface';

    /** Passes a pixel height to its slot: `defaultHeight` when it is a number, else the parent's content height */
    const props = withDefaults(defineProps<AutoSizerProps>(), { defaultWidth: '100%' });
    defineSlots<{ default(props: { height: number; width: number | string }): unknown }>();

    const wrapper = useTemplateRef('wrapper');
    const height = shallowRef(props.defaultHeight || 0);

    useResizeObserver(
        () => wrapper.value?.parentElement,
        () => {
            const parent = wrapper.value?.parentElement;
            if (!parent) {
                return;
            }
            const style = window.getComputedStyle(parent);
            const paddings = (Number.parseInt(style.paddingTop, 10) || 0) + (Number.parseInt(style.paddingBottom, 10) || 0);
            height.value = (parent.offsetHeight || 0) - paddings;
        }
    );
</script>

<template>
    <div ref="wrapper" :class="`${cssClasses.PREFIX}-auto-wrapper`" :style="{ height: toCssLength(props.defaultHeight), overflow: 'visible' }">
        <slot v-if="typeof height === 'number' && height !== 0" :height="height" :width="props.defaultWidth" />
    </div>
</template>
