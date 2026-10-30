<script setup lang="ts">
    import { Text, computed, useTemplateRef, watch, type ComponentPublicInstance } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/rating/constants';
    import RatingFoundation, { type RatingAdapter, type RatingFocusEvent, type RatingState } from '@fibrae/semi-foundation/rating/foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/rating/rating.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip';
    import type { RatingEmits, RatingHandle, RatingItemHandle, RatingProps, RatingSlots } from './interface';
    import RatingItem from './item.vue';

    type ClickEvent = MouseEvent | KeyboardEvent;
    type ListFocusEvent = FocusEvent & RatingFocusEvent;

    interface FoundationProps extends RatingProps {
        value?: number;
        autoFocus?: boolean;
    }

    type Foundation = RatingFoundation<FoundationProps, RatingState, ClickEvent, ListFocusEvent, KeyboardEvent>;
    type Adapter = RatingAdapter<FoundationProps, RatingState, ClickEvent, ListFocusEvent, KeyboardEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<RatingProps & /* @vue-ignore */ ElementProps<'ul', keyof RatingProps | EmitHandlers<RatingEmits>>>(), {
        modelValue: undefined,
        defaultValue: () => semiDefault('Rating', 'defaultValue', 0),
        count: () => semiDefault('Rating', 'count', 5),
        allowHalf: () => semiDefault('Rating', 'allowHalf', false),
        allowClear: () => semiDefault('Rating', 'allowClear', true),
        disabled: () => semiDefault('Rating', 'disabled', false),
        size: () => semiDefault('Rating', 'size', 'default'),
        tooltips: semiGlobalDefault('Rating', 'tooltips'),
        prefixCls: () => semiDefault('Rating', 'prefixCls', cssClasses.PREFIX),
        autofocus: semiGlobalDefault('Rating', 'autofocus'),
        preventScroll: semiGlobalDefault('Rating', 'preventScroll'),
        ariaLabel: semiGlobalDefault('Rating', 'ariaLabel'),
    });

    const emit = defineEmits<RatingEmits>();
    const slots = defineSlots<RatingSlots>();

    const config = useConfig();
    const locale = useLocale('Rating');

    const list = useTemplateRef('list');
    const stars = new Map<number, RatingItemHandle>();

    // Tooltip gives its trigger tabindex 0, which cannot be told apart from a caller's: the radios hold the one roving Tab
    // stop. A radiogroup has no control to carry a name.
    const DROPPED_ATTRS = new Set(['tabindex', 'tabIndex', 'name']);

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, RatingState>(
        RatingFoundation,
        props,
        (view) => RatingFoundation.getInitialState(view),
        (base) => ({
            focusStar: (starValue) => {
                // a value between radios has no radio to focus: Tab's landing radio stands in, as for focus()
                if (!RatingFoundation.isRadioValue(starValue, props.count, props.allowHalf)) {
                    focusTabStop();
                    return;
                }
                const index = Math.ceil(starValue) - 1;
                stars.get(index < 0 ? props.count : index)?.starFocus(starValue);
            },
            getStarDOM: (index) => stars.get(index)?.getDomNode() ?? null,
            setHover: (hoverValue, clearedValue) => base.setState({ hoverValue, clearedValue }),
            notifyHoverChange: (hoverValue) => emit('hoverChange', hoverValue),
            setValue: (value) => base.setState({ value }),
            notifyChange: (value) => {
                emit('update:modelValue', value);
                emit('change', value);
            },
            setClearedValue: (clearedValue) => base.setState({ clearedValue }),
            notifyClick: (event, index) => emit('click', event, index),
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            notifyKeyDown: (event) => emit('keydown', event),
            setFocusVisibleStar: (focusVisibleStar) => base.setState({ focusVisibleStar }),
        }),
        { context: () => config.value, props: { value: () => props.modelValue, autoFocus: () => props.autofocus } }
    );

    const value = computed(() => RatingFoundation.deriveValue({ value: props.modelValue }, state.value));
    const starIndexes = computed(() => Array.from({ length: props.count + 1 }, (_, index) => index));
    const onRadio = computed(() => RatingFoundation.isRadioValue(value.value, props.count, props.allowHalf));

    const focusTabStop = () => list.value?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus({ preventScroll: props.preventScroll });

    const setStar = (index: number, el: Element | ComponentPublicInstance | null) => {
        if (el) {
            stars.set(index, el as unknown as RatingItemHandle);
        } else {
            stars.delete(index);
        }
    };

    const customUnit = () => {
        const nodes = slots.character?.() ?? [];
        return nodes.length && nodes.every((node) => node.type === Text) ? nodes.map((node) => String(node.children)).join('') : undefined;
    };

    const groupLabel = (unit?: string) => {
        const { label, star, stars: plural } = locale.value.locale;
        return (
            props.ariaLabel ||
            label
                .replace('${value}', String(value.value))
                .replace('${count}', String(props.count))
                // a function replacer keeps `$&` and `$$` in a custom unit literal
                .replace('${unit}', () => unit ?? (value.value === 1 ? star : plural))
        );
    };

    const tipVisible = (index: number) => RatingFoundation.isTipVisible(index, state.value.hoverValue, state.value.focusVisibleStar, props.tooltips?.[index]);

    const rootAttrs = (attrs: Record<string, unknown>) => Object.fromEntries(Object.entries(attrs).filter(([key]) => !DROPPED_ATTRS.has(key)));

    const onFocusin = (event: FocusEvent) => {
        if (!props.disabled) {
            foundation.handleFocus(event as ListFocusEvent);
        }
    };

    // not gated by disabled: focus that was inside before the rating was disabled must still be released
    const onFocusout = (event: FocusEvent) => foundation.handleBlur(event as ListFocusEvent);

    const onKeydown = (event: KeyboardEvent) => {
        if (!props.disabled) {
            foundation.handleKeyDown(event, value.value);
        }
    };

    const onStarFocus = (event: FocusEvent, index: number) => {
        if (!props.disabled) {
            foundation.handleStarFocus({ target: event.target as HTMLElement }, index);
        }
    };

    watch(
        () => props.modelValue,
        (modelValue) => {
            if (modelValue === undefined) {
                foundation.resetValue();
            }
        }
    );

    defineExpose<RatingHandle>({
        focus: () => {
            if (!props.disabled) {
                focusTabStop();
            }
        },
        blur: () => {
            const active = FocusTrapHandle.getActiveElement(list.value);
            if (!props.disabled && active instanceof HTMLElement && list.value?.contains(active)) {
                active.blur();
            }
        },
    });
</script>

<template>
    <ul ref="list" v-bind="rootAttrs($attrs)" :aria-label="groupLabel(customUnit())" :class="[props.prefixCls, { [`${props.prefixCls}-disabled`]: props.disabled }]" role="radiogroup" tabindex="-1" @focusin="onFocusin" @focusout="onFocusout" @keydown="onKeydown" @mouseleave="foundation.handleMouseLeave">
        <!--
            mouseleave ignores disabled: a hover that began before the rating was disabled must still end.
            Item hands Tooltip's aria-describedby to its radios and drops the injected tabindex. customUnit() runs once
            per star because a single-element v-for to cache it would be rejected by vue/valid-v-for. Escape cannot hide
            the tip the rating drives, so closeOnEsc is off and the key goes on to the layer below.
        -->
        <component :is="props.tooltips ? Tooltip : SlotFragment" v-for="index in starIndexes" :key="index" :closeOnEsc="false" trigger="custom" :visible="tipVisible(index)">
            <template #content>{{ props.tooltips?.[index] ?? '' }}</template>
            <RatingItem
                :ref="(el) => setStar(index, el)"
                :allowHalf="props.allowHalf"
                :count="props.count"
                :disabled="props.disabled"
                :displayValue="state.hoverValue === undefined ? value : state.hoverValue"
                :firstTabStop="index === 0 && !onRadio"
                :index="index"
                :prefixCls="`${props.prefixCls}-star`"
                :preventScroll="props.preventScroll"
                :size="index === props.count ? 0 : props.size"
                :unit="customUnit()"
                :value="value"
                @pick="foundation.handleClick($event, index)"
                @preview="foundation.handleHover($event, index)"
                @radioFocus="onStarFocus($event, index)"
                @select="(event, selected) => foundation.handleSelect(event, index, selected)"
            >
                <template v-if="$slots.character" #character>
                    <slot name="character" />
                </template>
            </RatingItem>
        </component>
    </ul>
</template>
