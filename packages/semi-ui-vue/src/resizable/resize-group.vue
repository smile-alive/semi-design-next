<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/resizable/constants';
    import { ResizeGroupFoundation, type ResizeGroupAdapter, type ResizeGroupBaseState } from '@fibrae/semi-foundation/components/resizable/foundation';
    import '@fibrae/semi-foundation/components/resizable/resizable.scss';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault from '../_base/semi-default';
    import useEventListener, { getWindow } from '../_base/use-event-listener';
    import useFoundation from '../_base/use-foundation';
    import useResizeObserver from '../_base/use-resize-observer';
    import { provideResizeGroupContext } from './context';
    import type { ResizeGroupProps, ResizeGroupSlots } from './interface';

    type Foundation = ResizeGroupFoundation<ResizeGroupProps>;
    type Adapter = ResizeGroupAdapter<ResizeGroupProps>;

    // flex-direction follows `direction` even when the caller's style sets it; default fallthrough would put the
    // caller's style last.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ResizeGroupProps & /* @vue-ignore */ ElementProps<'div', keyof ResizeGroupProps>>(), {
        direction: () => semiDefault('ResizeGroup', 'direction', 'horizontal'),
    });

    defineSlots<ResizeGroupSlots>();

    const group = useTemplateRef('group');

    const { foundation, state } = useFoundation<Foundation, Adapter, ResizeGroupProps, ResizeGroupBaseState>(
        ResizeGroupFoundation,
        props,
        () => ResizeGroupFoundation.getInitialState(),
        () => ({
            getGroupRef: () => group.value,
        })
    );

    const prefix = cssClasses.PREFIX;

    // Vue keeps the native listeners of a detached element, so a handler that left the group (unmounted mid-drag) can
    // still send events: the foundation ignores those.
    provideResizeGroupContext({
        view: computed(() => ({ direction: props.direction })),
        registerItem: foundation.registerItem,
        registerHandler: foundation.registerHandler,
        notifyResizeStart: foundation.onResizeStart,
        notifyResizing: foundation.onResizing,
        notifyResizeEnd: foundation.onResizeEnd,
        notifyKeyDown: foundation.resizeByKey,
    });

    // vw and vh limits change with the window even when the group keeps its size
    useEventListener(getWindow, 'resize', () => foundation.ensureConstraint());

    useResizeObserver(group, () => {
        // a group first mounted inside display:none measures 0: lay out again once it becomes measurable
        foundation.handleGroupResize();
        // a container change without a window resize can leave px limits violated
        foundation.ensureConstraint();
    });
</script>

<template>
    <div v-bind="$attrs" ref="group" :class="`${prefix}-group`" :role="groupRole($attrs)" :style="{ flexDirection: props.direction === 'vertical' ? 'column' : 'row' }">
        <div v-if="state.isResizing" :class="`${prefix}-background`" :style="state.backgroundStyle" />
        <slot />
    </div>
</template>
