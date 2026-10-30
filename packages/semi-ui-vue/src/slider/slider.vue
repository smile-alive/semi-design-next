<script setup lang="ts">
    import { computed, useAttrs, useId, useTemplateRef, type CSSProperties } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/slider/constants';
    import SliderFoundation, { type HandleDot, type SliderAdapter, type SliderProps as BasicSliderProps, type SliderState } from '@fibrae/semi-foundation/slider/foundation';
    import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
    import '@fibrae/semi-foundation/slider/slider.scss';
    import { hasAutofocus, vAutofocus } from '../_base/autofocus';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip';
    import type { SliderEmits, SliderProps, SliderSlots } from './interface';

    type Handle = 'min' | 'max';

    interface FoundationProps extends Omit<SliderProps, 'tipFormatter'> {
        value?: number | number[];
        tipFormatter?: BasicSliderProps['tipFormatter'];
    }

    type Foundation = SliderFoundation<FoundationProps>;
    type Adapter = SliderAdapter<FoundationProps>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<SliderProps & /* @vue-ignore */ ElementProps<'div', keyof SliderProps | EmitHandlers<SliderEmits>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('Slider', 'defaultValue'),
        disabled: () => semiDefault('Slider', 'disabled', false),
        included: () => semiDefault('Slider', 'included', true),
        marks: semiGlobalDefault('Slider', 'marks'),
        max: () => semiDefault('Slider', 'max', 100),
        min: () => semiDefault('Slider', 'min', 0),
        range: () => semiDefault('Slider', 'range', false),
        step: () => semiDefault('Slider', 'step', 1),
        tipFormatter: undefined,
        tooltipVisible: semiGlobalDefault('Slider', 'tooltipVisible'),
        tooltipOnMark: () => semiDefault('Slider', 'tooltipOnMark', false),
        showMarkLabel: () => semiDefault('Slider', 'showMarkLabel', true),
        showArrow: () => semiDefault('Slider', 'showArrow', true),
        showBoundary: () => semiDefault('Slider', 'showBoundary', false),
        vertical: () => semiDefault('Slider', 'vertical', false),
        verticalReverse: () => semiDefault('Slider', 'verticalReverse', false),
        railStyle: semiGlobalDefault('Slider', 'railStyle'),
        handleDot: semiGlobalDefault('Slider', 'handleDot'),
        // no global default: a global id would repeat on every instance
        id: undefined,
        ariaLabel: semiGlobalDefault('Slider', 'ariaLabel'),
        ariaLabelledby: semiGlobalDefault('Slider', 'ariaLabelledby'),
        ariaValuetext: semiGlobalDefault('Slider', 'ariaValuetext'),
        getAriaValueText: undefined,
    });

    const emit = defineEmits<SliderEmits>();
    defineSlots<SliderSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('Slider');

    const generatedId = useId();
    const slider = useTemplateRef('slider');

    // The inputs are the Tab stops, and the slider role supports no aria-required (a native range has no required either).
    const DROPPED_INPUT_ATTRS = new Set(['tabindex', 'tabIndex', 'aria-required']);

    const prefix = cssClasses.PREFIX;
    const isRTL = computed(() => config.value.direction === 'rtl' && !props.vertical);
    const stylePos = computed(() => (props.vertical ? 'top' : isRTL.value ? 'right' : 'left'));
    const reverse = computed(() => (props.vertical && props.verticalReverse ? '-reverse' : ''));
    const handles = computed<Handle[]>(() => (props.range ? ['min', 'max'] : ['min']));

    // The input inside a handle is the control. Tooltip injects only keys its trigger leaves undefined, so these keep it
    // from describing the handle span and from making it a Tab stop; null renders no attribute.
    const NOT_A_TRIGGER_TARGET: Record<string, unknown> = { 'aria-describedby': null, tabindex: -1 };

    const tipFormatter = () => (props.tipFormatter !== undefined ? props.tipFormatter : readSemiDefault(semi, 'Slider', 'tipFormatter', (value: number) => value));

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, SliderState>(
        SliderFoundation,
        props as Readonly<FoundationProps>,
        (view) => SliderFoundation.getInitialState(view),
        () => ({
            getSliderNode: () => slider.value,
            notifyChange: (value) => {
                emit('update:modelValue', value);
                emit('change', value);
            },
            notifyAfterChange: (value) => emit('afterChange', value),
            notifyMouseUp: (event) => emit('mouseUp', event),
        }),
        { context: () => config.value, props: { value: () => props.modelValue, tipFormatter } }
    );

    const percent = computed(() => SliderFoundation.getMinAndMaxPercent({ range: props.range, min: props.min, max: props.max }, state.value.currentValue));

    const tips = computed(() =>
        SliderFoundation.computeHandleVisibleVal(
            {
                tooltipVisible: props.tooltipVisible,
                tipFormatter: tipFormatter(),
                range: props.range,
                step: props.step,
                min: props.min,
            },
            state.value
        )
    );

    const trackStyle = computed<CSSProperties>(() => {
        if (!props.included) {
            return {};
        }
        const { min, max } = percent.value;
        const size = props.range ? `${Math.abs(max - min) * 100}%` : `${min * 100}%`;
        const start = props.range ? `${Math.min(min, max) * 100}%` : 0;
        return { [props.vertical ? 'height' : 'width']: size, [stylePos.value]: start };
    });

    const marks = computed(() =>
        Object.entries(props.marks ?? {}).map(([key, label]) => {
            const value = Number(key);
            const active = SliderFoundation.isMarkActive({ min: props.min, max: props.max, range: props.range, included: props.included }, state.value.currentValue, value);
            return { key, value, label, active };
        })
    );

    const shownMarks = computed(() => marks.value.filter((mark) => mark.active !== false));

    const getAriaValueText = () => props.getAriaValueText ?? readSemiDefault(semi, 'Slider', 'getAriaValueText');

    const markPercent = (value: number) => ((value - props.min) / (props.max - props.min)) * 100;

    const handleIndex = (pos: Handle) => (pos === 'min' ? 0 : 1);

    const handleValue = (pos: Handle) => {
        const { currentValue } = state.value;
        return Array.isArray(currentValue) ? currentValue[handleIndex(pos)] : currentValue;
    };

    const handleStyle = (pos: Handle) => {
        const { chooseMovePos, isDrag } = state.value;
        const active = chooseMovePos === pos && (props.range || isDrag);
        return {
            [stylePos.value]: `${(pos === 'min' ? percent.value.min : percent.value.max) * 100}%`,
            zIndex: active ? 2 : 1,
        };
    };

    const handleDot = (pos: Handle): HandleDot | undefined => {
        return Array.isArray(props.handleDot) ? props.handleDot[handleIndex(pos)] : props.handleDot;
    };

    const dotStyle = (pos: Handle) => {
        const dot = handleDot(pos);
        return { width: dot?.size, height: dot?.size, backgroundColor: dot?.color };
    };

    const handleA11y = (pos: Handle) =>
        SliderFoundation.getHandleA11y({
            range: props.range,
            pos,
            id: props.id,
            ariaLabel: props.ariaLabel,
            ariaLabelledby: props.ariaLabelledby,
            generatedId,
            endName: pos === 'min' ? locale.value.locale.rangeStart : locale.value.locale.rangeEnd,
        });

    const valuetext = (pos: Handle) => {
        const format = getAriaValueText();
        return format ? format(handleValue(pos), handleIndex(pos)) : props.ariaValuetext;
    };

    // onKeydown goes to the inputs: the handler sees value keys, which never reach the root, and runs before the foundation's
    const isControlKey = (key: string) => key.startsWith('aria-') || ['name', 'tabindex', 'tabIndex', 'autofocus', 'onKeydown'].includes(key);

    // autofocus belongs to the start handle alone: the slider has one Tab stop to land on first
    const inputAttrs = (pos: Handle) => Object.fromEntries(Object.entries(splitControlAttrs(attrs, isControlKey).control).filter(([key]) => !DROPPED_INPUT_ATTRS.has(key) && (key !== 'autofocus' || pos === 'min')));

    // Only a single slider re-checks for a hidden container, on hover and on its input's focus: both show the tooltip.
    const syncSingle = () => {
        if (!props.range) {
            foundation.syncIsInRenderTree();
        }
    };

    const onHandleDown = (event: PointerEvent, pos: Handle) => {
        const handle = event.currentTarget as HTMLElement;
        // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
        const input = handle.querySelector('input');
        if (input) focusWithoutRing(input, { preventScroll: true });
        foundation.onHandleDown({ pointerId: event.pointerId, pointerType: event.pointerType, button: event.button, clientX: event.clientX, clientY: event.clientY, currentTarget: handle }, pos);
    };

    const onInputFocus = (event: FocusEvent, pos: Handle) => {
        foundation.onFocus({ target: event.target as HTMLInputElement }, pos);
        syncSingle();
    };

    const onInput = (event: Event, pos: Handle) => {
        const input = event.target as HTMLInputElement;
        foundation.handleInputChange(Number(input.value), pos);
        // A controlled or blocked handle keeps its rendered value, which Vue does not patch back after the browser moved it.
        input.value = String(handleValue(pos));
    };

    const onFocusout = (event: FocusEvent) => {
        if (!(event.currentTarget as Element).contains(event.relatedTarget as Node | null)) {
            emit('blur', event);
        }
    };

    // A literal array in the template is a new value on every render, so values are compared deeply.
    useDidUpdate(
        () => props.modelValue,
        (value) => {
            if (value === undefined) {
                foundation.resetValue();
                return;
            }
            foundation.handleValueChange(value);
            // a controlled value change ends a change too
            emit('afterChange', value);
        },
        isEqual,
        'pre'
    );
</script>

<template>
    <component :is="props.vertical ? SlotFragment : 'div'" :class="props.vertical ? undefined : prefix">
        <div
            ref="slider"
            v-bind="splitControlAttrs($attrs, isControlKey).root"
            :class="[
                `${prefix}-wrapper`,
                {
                    [`${prefix}-disabled`]: props.disabled,
                    [`${cssClasses.VERTICAL}-wrapper`]: props.vertical,
                    [`${prefix}-reverse`]: props.vertical && props.verticalReverse,
                },
            ]"
            @focusin="emit('focus', $event)"
            @focusout="onFocusout"
            @mouseenter="foundation.handleWrapperEnter"
            @mouseleave="foundation.handleWrapperLeave"
        >
            <div :class="`${prefix}-rail`" :style="props.railStyle" @click="foundation.handleWrapClick" />
            <div :class="cssClasses.TRACK" :style="trackStyle" @click="foundation.handleWrapClick" />
            <div v-if="marks.length" :class="cssClasses.DOTS">
                <component :is="props.tooltipOnMark ? Tooltip : SlotFragment" v-for="mark in shownMarks" :key="mark.key">
                    <template #content>
                        <slot :label="mark.label" name="mark" :value="mark.value">{{ mark.label }}</slot>
                    </template>
                    <!-- Tooltip would otherwise inject tabindex 0; the mark tip is for the pointer only -->
                    <span :class="[`${prefix}-dot`, { [`${prefix}-dot-active`]: mark.active === 'active' }]" :style="{ [stylePos]: `calc(${markPercent(mark.value)}% - 2px)` }" :tabindex="-1" @click="foundation.handleWrapClick" />
                </component>
            </div>
            <div>
                <!-- closeOnEsc off: the slider drives this tip, which Escape cannot hide, so the key goes on to the layer below -->
                <Tooltip v-for="pos in handles" :key="pos" :class="`${cssClasses.HANDLE}-tooltip`" :closeOnEsc="false" position="top" :showArrow="props.showArrow" trigger="custom" :visible="state.isInRenderTree && (tips.tipVisible[pos] || state.focusVisibleHandle === pos)">
                    <template #content>
                        <slot :handle="pos" name="tip" :value="tips.tipChildren[pos]">{{ tips.tipChildren[pos] }}</slot>
                    </template>
                    <span
                        v-bind="NOT_A_TRIGGER_TARGET"
                        :class="[cssClasses.HANDLE, { [`${cssClasses.HANDLE}-clicked`]: state.chooseMovePos === pos && state.isDrag }]"
                        :style="handleStyle(pos)"
                        @mousedown.prevent
                        @mouseenter="foundation.onHandleEnter(pos)"
                        @mouseleave="foundation.onHandleLeave"
                        @mouseover="syncSingle"
                        @pointerdown="onHandleDown($event, pos)"
                    >
                        <input
                            :id="handleA11y(pos).id"
                            v-autofocus="pos === 'min' && hasAutofocus($attrs)"
                            v-bind="inputAttrs(pos)"
                            :aria-label="handleA11y(pos).ariaLabel"
                            :aria-labelledby="handleA11y(pos).ariaLabelledby"
                            :aria-orientation="props.vertical ? 'vertical' : undefined"
                            :aria-valuetext="valuetext(pos)"
                            :class="`${cssClasses.HANDLE}-input`"
                            :dir="isRTL || (props.vertical && props.verticalReverse) ? 'rtl' : 'ltr'"
                            :disabled="props.disabled"
                            :max="props.max"
                            :min="props.min"
                            :step="props.step"
                            :style="props.vertical ? { writingMode: 'vertical-lr' } : undefined"
                            type="range"
                            :value="handleValue(pos)"
                            @blur="foundation.onBlur(pos)"
                            @focus="onInputFocus($event, pos)"
                            @input="onInput($event, pos)"
                            @keydown="foundation.handleKeyDown($event, pos)"
                            @keyup="foundation.handleKeyUp"
                        />
                        <div v-if="handleDot(pos)" :class="cssClasses.HANDLE_DOT" :style="dotStyle(pos)" />
                    </span>
                </Tooltip>
            </div>
            <div v-if="props.showMarkLabel && marks.length" :class="cssClasses.MARKS + reverse">
                <span v-for="mark in shownMarks" :key="mark.key" :class="`${prefix}-mark${reverse}`" :style="{ [stylePos]: `${markPercent(mark.value)}%` }" @click="foundation.handleMarkClick(mark.value)">
                    <slot :label="mark.label" name="mark" :value="mark.value">{{ mark.label }}</slot>
                </span>
            </div>
            <div :class="[`${prefix}-boundary`, { [`${prefix}-boundary-show`]: props.showBoundary && state.showBoundary }]">
                <span :class="`${prefix}-boundary-min`">{{ props.min }}</span>
                <span :class="`${prefix}-boundary-max`">{{ props.max }}</span>
            </div>
        </div>
    </component>
</template>
