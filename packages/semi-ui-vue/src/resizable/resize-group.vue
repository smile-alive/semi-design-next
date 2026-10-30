<script setup lang="ts">
    import { computed, useTemplateRef, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
    import { ResizeGroupFoundation, type ResizeGroupAdapter, type ResizeGroupBaseState } from '@fibrae/semi-foundation/resizable/foundation';
    import '@fibrae/semi-foundation/resizable/resizable.scss';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault from '../_base/semi-default';
    import useEventListener, { getWindow } from '../_base/use-event-listener';
    import useFoundation from '../_base/use-foundation';
    import useResizeObserver from '../_base/use-resize-observer';
    import { provideResizeGroupContext, type ResizeItemEntry } from './context';
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

    const prefix = cssClasses.PREFIX;

    // Items and handlers register in their mounted hooks, which run in tree order before the group's: index = layout
    // order. The foundation reads them only after mount, so they need not be reactive.
    const items: ResizeItemEntry[] = [];
    const handlers: HTMLDivElement[] = [];

    const { foundation, state } = useFoundation<Foundation, Adapter, ResizeGroupProps, ResizeGroupBaseState>(
        ResizeGroupFoundation,
        props,
        () => ({
            isResizing: false,
            originalPosition: { x: 0, y: 0, lastItemSize: 0, nextItemSize: 0 },
            backgroundStyle: { cursor: 'auto' },
            curHandler: null,
        }),
        () => ({
            getGroupRef: () => group.value,
            getItem: (index) => items[index].el,
            getItemCount: () => items.length,
            getHandler: (index) => handlers[index],
            getHandlerCount: () => handlers.length,
            getItemMin: (index) => items[index].min(),
            getItemMax: (index) => items[index].max(),
            getItemStart: (index) => items[index].start,
            getItemChange: (index) => items[index].change,
            getItemEnd: (index) => items[index].end,
            getItemDefaultSize: (index) => items[index].defaultSize(),
        })
    );

    const remove =
        <T>(list: T[], value: T) =>
        () => {
            list.splice(list.indexOf(value), 1);
        };

    provideResizeGroupContext({
        view: computed(() => ({ direction: props.direction })),
        registerItem: (entry) => {
            items.push(entry);
            return remove(items, entry);
        },
        registerHandler: (handler) => {
            handlers.push(handler);
            return remove(handlers, handler);
        },
        // Vue keeps the native listeners of a detached element, so a handler that left the group (unmounted mid-drag)
        // can still send events: those are ignored.
        notifyResizeStart: (handler, e) => {
            if (handlers.includes(handler)) {
                foundation.onResizeStart(handlers.indexOf(handler), e);
            }
        },
        notifyResizing: (handler, e) => {
            if (handlers.includes(handler)) {
                foundation.onResizing(e);
            }
        },
        notifyResizeEnd: (handler, e) => {
            if (handlers.includes(handler)) {
                foundation.onResizeEnd(e);
            }
        },
        notifyKeyDown: (handler, e) => handlers.includes(handler) && foundation.resizeByKey(handlers.indexOf(handler), e),
    });

    watch(() => props.direction, foundation.handleDirectionChange, { flush: 'post' });

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
