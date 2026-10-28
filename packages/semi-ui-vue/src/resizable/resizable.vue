<script setup lang="ts">
    import { computed, useAttrs, useTemplateRef, type HTMLAttributes, type StyleValue } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
    import { ResizableFoundation, type ResizableAdapter, type ResizableBaseState } from '@fibrae/semi-foundation/resizable/foundation';
    import { directions, type Direction } from '@fibrae/semi-foundation/resizable/types';
    import { getStringSize, isKeyboardEdge } from '@fibrae/semi-foundation/resizable/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
    import '@fibrae/semi-foundation/resizable/resizable.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import useResizeObserver from '../_base/use-resize-observer';
    import useLocale from '../locale/use-locale';
    import type { ResizableEmits, ResizableProps, ResizableSlots } from './interface';

    type Foundation = ResizableFoundation<ResizableProps>;
    type Adapter = ResizableAdapter<ResizableProps>;

    // The root merges the caller's style between the min/max style and the computed size, so a caller's width, height
    // or flex-basis cannot freeze the drag; default fallthrough would put the caller's style last.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ResizableProps & /* @vue-ignore */ ElementProps<'div', keyof ResizableProps | EmitHandlers<ResizableEmits>>>(), {
        size: semiGlobalDefault('Resizable', 'size'),
        defaultSize: semiGlobalDefault('Resizable', 'defaultSize'),
        enable: () =>
            semiDefault('Resizable', 'enable', {
                top: true,
                right: true,
                bottom: true,
                left: true,
                topRight: true,
                bottomRight: true,
                bottomLeft: true,
                topLeft: true,
            }),
        grid: () => semiDefault('Resizable', 'grid', [1, 1]),
        snap: semiGlobalDefault('Resizable', 'snap'),
        snapGap: () => semiDefault('Resizable', 'snapGap', 0),
        boundElement: semiGlobalDefault('Resizable', 'boundElement'),
        boundsByDirection: semiGlobalDefault('Resizable', 'boundsByDirection'),
        minWidth: semiGlobalDefault('Resizable', 'minWidth'),
        minHeight: semiGlobalDefault('Resizable', 'minHeight'),
        maxWidth: semiGlobalDefault('Resizable', 'maxWidth'),
        maxHeight: semiGlobalDefault('Resizable', 'maxHeight'),
        lockAspectRatio: () => semiDefault('Resizable', 'lockAspectRatio', false),
        lockAspectRatioExtraWidth: () => semiDefault('Resizable', 'lockAspectRatioExtraWidth', 0),
        lockAspectRatioExtraHeight: () => semiDefault('Resizable', 'lockAspectRatioExtraHeight', 0),
        scale: () => semiDefault('Resizable', 'scale', 1),
        ratio: () => semiDefault('Resizable', 'ratio', 1),
        handleStyle: semiGlobalDefault('Resizable', 'handleStyle'),
        handleClass: semiGlobalDefault('Resizable', 'handleClass'),
        handleWrapperStyle: semiGlobalDefault('Resizable', 'handleWrapperStyle'),
        handleWrapperClass: semiGlobalDefault('Resizable', 'handleWrapperClass'),
        onResizeStart: undefined,
    });

    const emit = defineEmits<ResizableEmits>();
    defineSlots<ResizableSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const locale = useLocale('Resizable');

    const root = useTemplateRef('root');

    const { foundation, state } = useFoundation<Foundation, Adapter, ResizableProps, ResizableBaseState>(
        ResizableFoundation,
        props,
        (view) => {
            const propSize = ResizableFoundation.getPropSize(view);
            return {
                isResizing: false,
                width: propSize.width ?? 'auto',
                height: propSize.height ?? 'auto',
                direction: 'right',
                original: { x: 0, y: 0, width: 0, height: 0 },
                backgroundStyle: { cursor: 'auto' },
                flexBasis: undefined,
            };
        },
        () => ({
            getResizable: () => root.value,
            notifyResizeStart: (e, direction) => (props.onResizeStart ?? readSemiDefault(semi, 'Resizable', 'onResizeStart'))?.(e, direction),
            notifyChange: (size, event, direction) => {
                emit('update:size', size);
                emit('change', size, event, direction);
            },
            notifyResizeEnd: (size, event, direction) => emit('resizeEnd', size, event, direction),
        })
    );

    const prefix = cssClasses.PREFIX;

    const enabledDirections = computed(() => {
        const { enable } = props;
        return enable ? directions.filter((dir) => enable[dir] !== false) : [];
    });

    const rootStyle = (): StyleValue => {
        const { isResizing, flexBasis } = state.value;
        return [
            {
                userSelect: isResizing ? 'none' : 'auto',
                maxWidth: toCssLength(props.maxWidth),
                maxHeight: toCssLength(props.maxHeight),
                minWidth: toCssLength(props.minWidth),
                minHeight: toCssLength(props.minHeight),
            },
            attrs.style as StyleValue,
            ResizableFoundation.getSizeStyle(props, state.value),
            flexBasis ? { flexBasis: getStringSize(flexBasis) } : {},
        ];
    };

    const separatorAttrs = (dir: Direction): HTMLAttributes => {
        if (!props.enable || !isKeyboardEdge(props.enable, dir)) {
            return {};
        }
        const horizontal = dir === 'right' || dir === 'left';
        const range = state.value.ariaRange?.[horizontal ? 'width' : 'height'];
        const text = locale.value.locale;
        return {
            role: 'separator',
            tabindex: 0,
            'aria-orientation': horizontal ? 'vertical' : 'horizontal',
            'aria-label': horizontal ? text.resizeWidth : text.resizeHeight,
            'aria-valuenow': range && Math.round(range.now),
            'aria-valuemin': range && Math.round(range.min),
            'aria-valuemax': range && Math.round(range.max),
            onKeydown: (e: KeyboardEvent) => {
                if (foundation.resizeByKey(dir, e)) {
                    e.preventDefault();
                }
            },
        };
    };

    const onHandlePointerdown = (dir: Direction, e: PointerEvent) => {
        if (isSecondaryPress(e)) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        foundation.onResizeStart(e, dir);
    };

    useResizeObserver(root, () => foundation.updateAriaRange());
</script>

<template>
    <div v-bind="$attrs" ref="root" :class="`${prefix}-resizable`" :role="groupRole($attrs)" :style="rootStyle()">
        <div v-if="state.isResizing" :class="`${prefix}-background`" :style="state.backgroundStyle" />
        <slot />
        <div v-if="props.enable" :class="props.handleWrapperClass" :style="props.handleWrapperStyle">
            <div
                v-for="dir in enabledDirections"
                :key="dir"
                v-bind="separatorAttrs(dir)"
                :class="[props.handleClass?.[dir], `${prefix}-resizableHandler`, `${prefix}-resizableHandler-${dir}`]"
                :style="props.handleStyle?.[dir]"
                @lostpointercapture="foundation.onResizeEnd"
                @pointerdown="onHandlePointerdown(dir, $event)"
                @pointermove="foundation.onResizing"
            >
                <slot :direction="dir" name="handle" />
            </div>
        </div>
    </div>
</template>
