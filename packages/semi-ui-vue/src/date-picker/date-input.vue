<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { isSplitRangeInputs } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
    import { cssClasses } from '@fibrae/semi-foundation/date-picker/constants';
    import DateInputFoundation, { type DateInputAdapter, type DateInputFoundationProps, type InsetInputChangeFoundationProps, type InsetInputValue, type RangeInput } from '@fibrae/semi-foundation/date-picker/input-foundation';
    import { IconCalendar, IconCalendarClock, IconClear } from '@fibrae/semi-icons-vue';
    import slotKind from '../_base/slot-kind';
    import useFocusHandover from '../_base/use-focus-handover';
    import useFoundation from '../_base/use-foundation';
    import Input from '../input/input.vue';
    import useLocale from '../locale/use-locale';
    import InsetInput from './inset-input.vue';
    import type { DatePickerDateInputEmits, DatePickerDateInputHandle, DatePickerDateInputProps, DatePickerDateInputSlots } from './internal';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<DatePickerDateInputProps>(), {
        value: () => [],
        inputValue: undefined,
        placeholder: undefined,
        format: undefined,
        dateFnsLocale: undefined,
        disabled: false,
        showClear: true,
        showClearIgnoreDisabled: false,
        inputReadOnly: false,
        inputStyle: undefined,
        insetLabelId: undefined,
        validateStatus: undefined,
        borderless: false,
        size: undefined,
        autofocus: false,
        rangeInputFocus: false,
        insetInput: false,
        insetInputValue: undefined,
        defaultPickerValue: undefined,
        density: undefined,
    });

    const emit = defineEmits<DatePickerDateInputEmits>();
    const slots = defineSlots<DatePickerDateInputSlots>();

    const locale = useLocale('DatePicker');

    const single = useTemplateRef('single');
    const rangeStartInput = useTemplateRef('rangeStartInput');
    const rangeEndInput = useTemplateRef('rangeEndInput');
    const insetStart = useTemplateRef('insetStart');
    const insetEnd = useTemplateRef('insetEnd');

    // Vue's StyleValue (inputStyle) is wider than the foundation's Record<string, any>, so the props type does not match.
    const { foundation } = useFoundation<DateInputFoundation, DateInputAdapter, DateInputFoundationProps, Record<string, never>>(
        DateInputFoundation,
        props as unknown as Readonly<Partial<DateInputFoundationProps>>,
        () => ({}),
        () => ({
            notifyChange: (value, event) => emit('change', value, event),
            notifyEnter: (value) => emit('enterPress', value),
            notifyClear: (event) => emit('clear', event),
            notifyRangeInputClear: (event) => emit('rangeClear', event),
            notifyRangeInputFocus: (event, rangeType) => emit('focus', event, rangeType),
            notifyTabPress: (event) => emit('rangeEndTabPress', event),
            notifyInsetInputChange: (options) => emit('insetInputChange', options),
        })
    );

    // the clear button unmounts under the focus when the value is cleared, from it or from outside
    const clearHandover = useFocusHandover(() => rangeStartInput.value?.input);

    const prefix = cssClasses.PREFIX;
    const isRange = computed(() => isSplitRangeInputs(props.type));
    const text = computed(() => DateInputFoundation.getShowText(props));

    const inputClass = computed(() => ({
        [`${prefix}-input-readonly`]: props.inputReadOnly,
        [`${prefix}-monthRange-input`]: props.type === 'monthRange',
    }));

    const singlePlaceholder = computed(() => (props.type === 'monthRange' && Array.isArray(props.placeholder) ? props.placeholder[0] + props.rangeSeparator + props.placeholder[1] : (props.placeholder as string | undefined)));

    const rangeParts = computed(() => {
        const [start = '', end = ''] = text.value.split(props.rangeSeparator);
        return { start, end };
    });

    const rangePlaceholder = computed(() => (Array.isArray(props.placeholder) ? props.placeholder : [props.placeholder, props.placeholder]));
    const allowRangeClear = computed(() => DateInputFoundation.getRangeClearVisible({ ...rangeParts.value, showClear: props.showClear, disabled: props.disabled, showClearIgnoreDisabled: props.showClearIgnoreDisabled }));

    const insetValue = computed(() =>
        // a missing insetInputValue makes the foundation format `value` instead
        DateInputFoundation.getInsetInputValue(props, {
            value: props.value,
            insetInputValue: props.insetInputValue as InsetInputValue,
        })
    );

    const insetPlaceholders = computed(() => {
        const own = (typeof props.insetInput === 'object' && props.insetInput.placeholder) || {};
        const { datePlaceholder, timePlaceholder } = DateInputFoundation.getInsetInputPlaceholder(props);
        return {
            dateStart: own.dateStart ?? datePlaceholder,
            dateEnd: own.dateEnd ?? datePlaceholder,
            timeStart: own.timeStart ?? timePlaceholder,
            timeEnd: own.timeEnd ?? timePlaceholder,
        };
    });

    const insetNames = computed(() => DateInputFoundation.getInsetNames(locale.value.locale, props.type));

    const rangeValue = (start: string, end: string) => `${start}${props.rangeSeparator}${end}`;

    const changeSingle = (value: string, event: Event) => foundation.handleChange(value, event);

    const changeRangeStart = (value: string, event: Event) => foundation.handleChange(rangeValue(value, rangeParts.value.end), event);

    const changeRangeEnd = (value: string, event: Event) => foundation.handleChange(rangeValue(rangeParts.value.start, value), event);

    // The field's label names the group around the two inputs, not each input
    const rangeAttrs = (attrs: Record<string, unknown>) => Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'aria-label' && key !== 'aria-labelledby'));

    const hasLabel = () => Boolean(slotKind(slots.prefix) || slotKind(slots.insetLabel));

    const focusRange = (event: FocusEvent | MouseEvent, rangeType: RangeInput) => foundation.handleRangeInputFocus(event, rangeType);

    const focusStartOnClick = (event: MouseEvent) => {
        if (!props.disabled && !props.rangeInputFocus) {
            focusRange(event, 'rangeStart');
        }
    };

    const changeInset = (options: InsetInputChangeFoundationProps) => foundation.handleInsetInputChange(options);

    defineExpose<DatePickerDateInputHandle>({
        get input() {
            return single.value;
        },
        get rangeStart() {
            return props.insetInput ? insetStart.value : rangeStartInput.value;
        },
        get rangeEnd() {
            return props.insetInput ? insetEnd.value : rangeEndInput.value;
        },
    });
</script>

<template>
    <div v-if="props.insetInput" :class="`${prefix}-inset-input-wrapper`" :x-type="props.type">
        <InsetInput ref="insetStart" :ariaLabel="insetNames.start" :insetInputValue="insetValue" kind="date" panel="monthLeft" :placeholder="insetPlaceholders.dateStart" :type="props.type" @change="changeInset" @focus="emit('insetDateFocus', $event, 'rangeStart')" />
        <InsetInput :ariaLabel="insetNames.startTime" :disabled="!insetValue.monthLeft.dateInput" :insetInputValue="insetValue" kind="time" panel="monthLeft" :placeholder="insetPlaceholders.timeStart" :type="props.type" @change="changeInset" @focus="emit('insetTimeFocus')" />
        <template v-if="isRange">
            <div :class="`${prefix}-inset-input-separator`">{{ props.density === 'compact' ? '' : '-' }}</div>
            <InsetInput ref="insetEnd" :ariaLabel="insetNames.end" :insetInputValue="insetValue" kind="date" panel="monthRight" :placeholder="insetPlaceholders.dateEnd" :type="props.type" @change="changeInset" @focus="emit('insetDateFocus', $event, 'rangeEnd')" />
            <InsetInput :ariaLabel="insetNames.endTime" :disabled="!insetValue.monthRight.dateInput" :insetInputValue="insetValue" kind="time" panel="monthRight" :placeholder="insetPlaceholders.timeEnd" :type="props.type" @change="changeInset" @focus="emit('insetTimeFocus')" />
        </template>
    </div>
    <template v-else-if="isRange">
        <!-- The pointer target of the label only moves the focus to the start input. The id is what a Form inset label's aria-labelledby points at. -->
        <div v-if="hasLabel()" :id="$slots.prefix ? undefined : props.insetLabelId" :class="`${prefix}-range-input-prefix`" x-semi-prop="prefix,insetLabel" @click="focusStartOnClick">
            <slot v-if="$slots.prefix" name="prefix" />
            <slot v-else name="insetLabel" />
        </div>
        <div
            :class="[inputClass, `${prefix}-range-input-wrapper-start`, `${prefix}-range-input-wrapper`, { [`${prefix}-range-input-wrapper-active`]: props.rangeInputFocus === 'rangeStart' && !props.disabled, [`${prefix}-range-input-wrapper-start-with-prefix`]: hasLabel(), [`${prefix}-borderless`]: props.borderless }]"
            @click="!props.disabled && focusRange($event, 'rangeStart')"
        >
            <Input
                v-bind="rangeAttrs($attrs)"
                ref="rangeStartInput"
                :autofocus="props.autofocus"
                :borderless="props.borderless"
                :disabled="props.disabled"
                :modelValue="rangeParts.start"
                :placeholder="rangePlaceholder[0]"
                :readOnly="props.inputReadOnly"
                :showClear="false"
                :size="props.size === 'large' ? 'default' : 'small'"
                :style="props.inputStyle"
                @change="changeRangeStart"
                @enterPress="foundation.handleRangeInputEnterPress($event, rangeValue(rangeParts.start, rangeParts.end))"
                @focus="focusRange($event, 'rangeStart')"
            />
        </div>
        <span :class="[`${prefix}-range-input-separator`, { [`${prefix}-range-input-separator-active`]: Boolean(rangeParts.start || rangeParts.end) && !props.disabled }]" @click="!props.disabled && focusRange($event, 'rangeStart')">
            <slot name="rangeSeparator">{{ props.rangeSeparator }}</slot>
        </span>
        <div :class="[inputClass, `${prefix}-range-input-wrapper-end`, `${prefix}-range-input-wrapper`, { [`${prefix}-range-input-wrapper-active`]: props.rangeInputFocus === 'rangeEnd' && !props.disabled, [`${prefix}-borderless`]: props.borderless }]" @click="!props.disabled && focusRange($event, 'rangeEnd')">
            <Input
                v-bind="rangeAttrs($attrs)"
                ref="rangeEndInput"
                :borderless="props.borderless"
                :disabled="props.disabled"
                :modelValue="rangeParts.end"
                :placeholder="rangePlaceholder[1]"
                :readOnly="props.inputReadOnly"
                :showClear="false"
                :size="props.size === 'large' ? 'default' : 'small'"
                :style="props.inputStyle"
                @change="changeRangeEnd"
                @enterPress="foundation.handleRangeInputEnterPress($event, rangeValue(rangeParts.start, rangeParts.end))"
                @focus="focusRange($event, 'rangeEnd')"
                @keydown="foundation.handleRangeInputEndKeyPress($event)"
            />
        </div>
        <button v-if="allowRangeClear" :ref="clearHandover" :aria-label="locale.locale.clearRange" :class="`${prefix}-range-input-clearbtn`" type="button" @click="foundation.handleRangeInputClearClick($event)" @mousedown="foundation.handleRangeInputClearMouseDown($event)">
            <slot name="clearIcon">
                <IconClear />
            </slot>
        </button>
        <div :class="`${prefix}-range-input-suffix`" @click="focusStartOnClick">
            <IconCalendarClock v-if="props.type.includes('Time')" />
            <IconCalendar v-else />
        </div>
    </template>
    <Input
        v-else
        v-bind="$attrs"
        ref="single"
        :autofocus="props.autofocus"
        :borderless="props.borderless"
        :class="inputClass"
        :disabled="props.disabled"
        :hideSuffix="props.showClear"
        :insetLabelId="props.insetLabelId"
        :modelValue="text"
        :placeholder="singlePlaceholder"
        :readOnly="props.inputReadOnly"
        :showClear="props.showClear"
        :showClearIgnoreDisabled="props.showClearIgnoreDisabled"
        :size="props.size"
        :style="props.inputStyle"
        :validateStatus="props.validateStatus"
        @change="changeSingle"
        @clear="foundation.handleInputClear($event)"
        @enterPress="foundation.handleInputComplete($event)"
        @focus="emit('focus', $event)"
    >
        <template v-if="$slots.prefix" #prefix>
            <slot name="prefix" />
        </template>
        <template v-if="$slots.insetLabel" #insetLabel>
            <slot name="insetLabel" />
        </template>
        <template v-if="$slots.clearIcon" #clearIcon>
            <slot name="clearIcon" />
        </template>
        <template #suffix>
            <IconCalendarClock v-if="props.type.includes('Time')" />
            <IconCalendar v-else />
        </template>
    </Input>
</template>
