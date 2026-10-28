<script setup lang="ts">
    import { onBeforeUnmount, watch, type ComponentPublicInstance } from 'vue';
    import DragMoveFoundation, { type DragMoveAdapter } from '@fibrae/semi-foundation/drag-move/foundation';
    import semiDefault, { readSemiDefault, useSemiGlobal } from '../_base/semi-default';
    import slotNodes from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import type { DragMoveEmits, DragMoveProps, DragMoveSlots } from './interface';

    type Foundation = DragMoveFoundation<DragMoveProps>;
    type Adapter = DragMoveAdapter<DragMoveProps>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<DragMoveProps>(), {
        handler: undefined,
        constrainer: undefined,
        allowInputDrag: () => semiDefault('DragMove', 'allowInputDrag', false),
        allowMove: undefined,
        customMove: undefined,
        positionStrategy: () => semiDefault('DragMove', 'positionStrategy', 'absolute'),
    });

    const emit = defineEmits<DragMoveEmits>();
    defineSlots<DragMoveSlots>();

    const semi = useSemiGlobal();

    // Native pointerdown on each top-level child element: `currentTarget` is the dragged element and child components
    // need not pass attrs to their root. ResizeObserver reports each child before paint, when the position strategy and
    // move cursor are applied.
    // Known limit: a child component swapping its own root without a parent re-render is not re-bound (the function ref
    // only runs on a patch); re-read the instance's $el in onUpdated if that use appears.
    const bound = new Map<string, HTMLElement>();
    let observer: ResizeObserver | undefined;

    const { foundation } = useFoundation<Foundation, Adapter, DragMoveProps, object>(
        DragMoveFoundation,
        props,
        () => ({}),
        () => ({
            notifyMouseDown: (e) => emit('mouseDown', e),
            notifyMouseMove: (e) => emit('mouseMove', e),
            notifyMouseUp: (e) => emit('mouseUp', e),
            notifyTouchStart: (e) => emit('touchStart', e),
            notifyTouchMove: (e) => emit('touchMove', e),
            notifyTouchEnd: (e) => emit('touchEnd', e),
            notifyTouchCancel: (e) => emit('touchCancel', e),
        }),
        {
            props: {
                handler: () => props.handler ?? readSemiDefault(semi, 'DragMove', 'handler'),
                constrainer: () => props.constrainer ?? readSemiDefault(semi, 'DragMove', 'constrainer'),
                allowMove: () => props.allowMove ?? readSemiDefault(semi, 'DragMove', 'allowMove'),
                customMove: () => props.customMove ?? readSemiDefault(semi, 'DragMove', 'customMove'),
            },
        }
    );

    const track = (key: string, ref: Element | ComponentPublicInstance | null) => {
        const el = ref instanceof HTMLElement ? ref : ref && '$el' in ref && ref.$el instanceof HTMLElement ? ref.$el : null;
        const previous = bound.get(key);
        if (previous === el) {
            return;
        }
        if (previous) {
            previous.removeEventListener('pointerdown', foundation.handlePointerDown);
            observer?.unobserve(previous);
            bound.delete(key);
        }
        if (!el) {
            return;
        }
        observer ??= new ResizeObserver((entries) => foundation.prepareElements(entries.map((entry) => entry.target)));
        el.addEventListener('pointerdown', foundation.handlePointerDown);
        observer.observe(el);
        bound.set(key, el);
    };

    const trackRef = (key: string) => (ref: Element | ComponentPublicInstance | null) => track(key, ref);

    watch(
        () => props.positionStrategy,
        () => foundation.updatePositionStrategy(),
        { flush: 'post' }
    );

    onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
    <component :is="node" v-for="[node, key] in slotNodes($slots.default?.() ?? [])" :key="key" :ref="trackRef(key)" />
</template>
