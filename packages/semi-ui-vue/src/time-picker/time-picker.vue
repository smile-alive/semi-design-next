<script setup lang="ts">
    import { computed, onDeactivated, onMounted, onUpdated, shallowRef, useAttrs, useId, useTemplateRef, watch } from 'vue';
    import type { Locale } from 'date-fns';
    import ComboboxFoundation from '@fibrae/semi-foundation/time-picker/combox-foundation';
    import { cssClasses, strings } from '@fibrae/semi-foundation/time-picker/constants';
    import TimePickerFoundation, { type TimePickerAdapter } from '@fibrae/semi-foundation/time-picker/foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/time-picker/time-picker.scss';
    import { isNotClassOrStyle, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useClickOutside from '../_base/use-click-outside';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover/popover.vue';
    import { useNestedPopups } from '../tooltip/context';
    import Combobox from './combobox.vue';
    import type { TimePickerEmits, TimePickerHandle, TimePickerProps, TimePickerSlots, TimePickerState, TimePickerTriggerSlotProps } from './interface';
    import TimeInput from './time-input.vue';

    interface FoundationProps extends TimePickerProps {
        value?: TimePickerProps['modelValue'];
        dateFnsLocale?: Locale;
    }

    type Foundation = TimePickerFoundation<FoundationProps, FocusEvent>;
    type Adapter = TimePickerAdapter<FoundationProps, FocusEvent>;

    // Compared by time, so a new Date of the same time does not overwrite the text being typed.
    type Value = TimePickerProps['modelValue'];

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TimePickerProps & /* @vue-ignore */ ElementProps<'input', keyof TimePickerProps | EmitHandlers<TimePickerEmits> | 'value'>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('TimePicker', 'defaultValue'),
        open: undefined,
        defaultOpen: () => semiDefault('TimePicker', 'defaultOpen', false),
        type: () => semiDefault('TimePicker', 'type', strings.DEFAULT_TYPE),
        format: semiGlobalDefault('TimePicker', 'format'),
        use12Hours: () => semiDefault('TimePicker', 'use12Hours', false),
        hourStep: semiGlobalDefault('TimePicker', 'hourStep'),
        minuteStep: semiGlobalDefault('TimePicker', 'minuteStep'),
        secondStep: semiGlobalDefault('TimePicker', 'secondStep'),
        disabled: () => semiDefault('TimePicker', 'disabled', false),

        // Function-typed props cannot take a factory default; global defaults are read in `disabledFns`
        disabledHours: undefined,
        disabledMinutes: undefined,
        disabledSeconds: undefined,
        disabledTime: undefined,
        hideDisabledOptions: () => semiDefault('TimePicker', 'hideDisabledOptions', false),
        placeholder: semiGlobalDefault('TimePicker', 'placeholder'),
        rangeSeparator: () => semiDefault('TimePicker', 'rangeSeparator', strings.DEFAULT_RANGE_SEPARATOR),
        size: () => semiDefault('TimePicker', 'size', 'default'),
        borderless: () => semiDefault('TimePicker', 'borderless', false),
        showClear: () => semiDefault('TimePicker', 'showClear', true),
        inputReadOnly: () => semiDefault('TimePicker', 'inputReadOnly', false),
        validateStatus: semiGlobalDefault('TimePicker', 'validateStatus'),
        insetLabelId: undefined,
        inputStyle: semiGlobalDefault('TimePicker', 'inputStyle'),
        autofocus: () => semiDefault('TimePicker', 'autofocus', false),
        focusOnOpen: () => semiDefault('TimePicker', 'focusOnOpen', false),
        preventScroll: semiGlobalDefault('TimePicker', 'preventScroll'),

        motion: () => semiDefault('TimePicker', 'motion', true),
        autoAdjustOverflow: () => semiDefault('TimePicker', 'autoAdjustOverflow', true),
        position: semiGlobalDefault('TimePicker', 'position'),
        popupClassName: semiGlobalDefault('TimePicker', 'popupClassName'),
        popupStyle: semiGlobalDefault('TimePicker', 'popupStyle'),
        stopPropagation: () => semiDefault('TimePicker', 'stopPropagation', true),
        // read in the computed below: ConfigProvider's timeZone comes before the global default
        timeZone: undefined,
        scrollItemProps: semiGlobalDefault('TimePicker', 'scrollItemProps'),
    });

    const emit = defineEmits<TimePickerEmits>();
    const slots = defineSlots<TimePickerSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('TimePicker');

    const root = useTemplateRef('root');
    const panel = useTemplateRef('panel');
    const trigger = useTemplateRef('trigger');
    const panelId = useId();

    // A #trigger is user markup: only the rendered DOM tells whether it brings its own focus target.
    // Known limitation: measured only after this component renders; a trigger child that later updates its own DOM
    // leaves the measurement stale. Upgrade to a MutationObserver on the wrapper if such triggers need support.
    const customTriggerFocusable = shallowRef(false);

    const prefix = cssClasses.PREFIX;
    const timeZone = computed(() => props.timeZone ?? config.value.timeZone ?? readSemiDefault(semi, 'TimePicker', 'timeZone'));
    const isRange = computed(() => props.type === strings.TYPE_TIME_RANGE_PICKER);
    const format = computed(() => TimePickerFoundation.getValidFormat(props));
    const position = computed(() => TimePickerFoundation.getPosition(props, config.value.direction));
    const placeholder = computed(() => props.placeholder ?? locale.value.locale.placeholder[props.type]);

    const panelClass = computed(() => {
        const { showHour, showMinute, showSecond } = ComboboxFoundation.getColumns(format.value);
        const columnCount = [showHour, showMinute, showSecond, props.use12Hours].filter(Boolean).length;
        return [
            `${prefix}-panel`,
            `${prefix}-panel-${props.size}`,
            props.popupClassName,
            {
                [`${prefix}-panel-narrow`]: (!showHour || !showMinute || !showSecond) && !props.use12Hours,
                [cssClasses.RANGE_PICKER]: isRange.value,
            },
            `${prefix}-panel-column-${columnCount}`,
        ];
    });

    // Not computed: global defaults are not reactive
    const disabledFns = () => ({
        disabledHours: props.disabledHours ?? readSemiDefault(semi, 'TimePicker', 'disabledHours'),
        disabledMinutes: props.disabledMinutes ?? readSemiDefault(semi, 'TimePicker', 'disabledMinutes'),
        disabledSeconds: props.disabledSeconds ?? readSemiDefault(semi, 'TimePicker', 'disabledSeconds'),
        disabledTime: props.disabledTime ?? readSemiDefault(semi, 'TimePicker', 'disabledTime'),
    });

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, TimePickerState>(
        TimePickerFoundation,
        props,
        (view) => ({ open: Boolean((view.open || view.defaultOpen) && !view.disabled), ...TimePickerFoundation.getInitialState(view) }),
        (base) => ({
            setPanelOpen: (open) => base.setState({ open }),
            setInputValue: (inputValue) => base.setState({ inputValue }),
            notifyOpenChange: (open) => {
                emit('update:open', open);
                emit('openChange', open);
            },
            notifyChange: (value, str) => {
                emit('update:modelValue', value);
                emit('change', value, str);
            },
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            isRangePicker: () => props.type === strings.TYPE_TIME_RANGE_PICKER,
            isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panel.value),
            setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(root.value, { preventScroll: props.preventScroll }),
        }),
        {
            props: {
                value: () => props.modelValue,
                timeZone: () => timeZone.value,
                dateFnsLocale: () => locale.value.dateFnsLocale,
                disabledHours: () => disabledFns().disabledHours,
                disabledMinutes: () => disabledFns().disabledMinutes,
                disabledSeconds: () => disabledFns().disabledSeconds,
                disabledTime: () => disabledFns().disabledTime,
            },
        }
    );

    const open = computed(() => TimePickerFoundation.isPanelShown(props, state.value));

    const sameTime = (a: unknown, b: unknown) => (a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : Object.is(a, b));

    const sameValue = (a: Value, b: Value) => (Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((item, index) => sameTime(item, b[index])) : sameTime(a, b));

    const panelFns = (index: number) => TimePickerFoundation.getDisabledTimeFns(disabledFns(), state.value.value, index === 1 ? 'right' : 'left', isRange.value);

    const hasPanel = (index: number) => isRange.value && hasSlotContent(() => slots.panel?.({ index }) ?? []);

    const rootRole = () => (slots.trigger && (attrs['aria-label'] || attrs['aria-labelledby']) ? 'group' : undefined);

    const onRootClick = () => {
        if (slots.trigger) {
            foundation.handlePanelOpen();
        }
    };

    const measureCustomTrigger = () => {
        if (slots.trigger && trigger.value) {
            customTriggerFocusable.value = FocusTrapHandle.getFocusableElements(trigger.value).length > 0;
        }
    };

    // Without a focus target of its own, the #trigger's wrapper is the Tab stop and acts as the button that opens the
    // panel. Slots are not reactive, so this is read while rendering.
    const isTriggerButton = () => Boolean(slots.trigger) && !customTriggerFocusable.value;

    const onTriggerKeyDown = (event: KeyboardEvent) => {
        if (isTriggerButton() && event.target === event.currentTarget) {
            foundation.handleTriggerKeyDown(event);
        }
    };

    const triggerSlotProps = (): TimePickerTriggerSlotProps => ({
        value: state.value.value,
        inputValue: state.value.inputValue,
        placeholder: placeholder.value,
        disabled: props.disabled,
        componentProps: { ...props },
        onChange: (inputValue) => foundation.handleInputChange(inputValue),
    });

    useClickOutside([root, panel], (event) => foundation.handleClickOutside(event), open, useNestedPopups());

    // A cached KeepAlive subtree would keep the panel open; just close it, with no blur or focus return.
    onDeactivated(() => {
        if (open.value) {
            foundation.close();
        }
    });

    useDidUpdate(
        () => ({ value: props.modelValue, timeZone: timeZone.value }),
        (current, previous) => {
            if (!sameValue(current.value, previous.value)) {
                foundation.syncValueFromProps({ value: current.value ?? [], timeZone: current.timeZone });
            } else {
                foundation.syncValueFromProps({
                    value: foundation.getState('value'),
                    timeZone: current.timeZone,
                    prevTimeZone: previous.timeZone,
                });
            }
        },
        (a, b) => sameValue(a.value, b.value) && a.timeZone === b.timeZone,
        'pre'
    );

    // only the text changes: syncing the value again would re-zone it a second time
    watch(
        () => [TimePickerFoundation.getValidFormat(props), locale.value.dateFnsLocale, props.rangeSeparator],
        () => foundation.refreshInputValue()
    );

    // isPanelShown is already false for a disabled picker, so the check leaves `disabled` out
    watch(
        () => props.disabled,
        (disabled) => {
            if (disabled && TimePickerFoundation.isPanelShown({ open: props.open }, state.value)) {
                foundation.close();
            }
        }
    );

    onMounted(measureCustomTrigger);
    onUpdated(measureCustomTrigger);

    defineExpose<TimePickerHandle>({
        focus: () => root.value?.querySelector('input')?.focus({ preventScroll: props.preventScroll }),
        blur: () => root.value?.querySelector('input')?.blur(),
    });
</script>

<template>
    <div ref="root" v-bind="$slots.trigger ? $attrs : splitControlAttrs($attrs, isNotClassOrStyle).root" :class="prefix" :role="rootRole()" @click="onRootClick">
        <Popover
            :ariaLabel="locale.locale.panel[props.type]"
            :autoAdjustOverflow="props.autoAdjustOverflow"
            :contentClassName="panelClass"
            :motion="props.motion"
            :position="position"
            :stopPropagation="props.stopPropagation"
            :style="props.popupStyle"
            trigger="custom"
            :visible="open"
            @escKeyDown="foundation.handleEscKeyDown()"
        >
            <template #content>
                <div :id="panelId" ref="panel" :class="{ [cssClasses.RANGE_PANEL_LISTS]: isRange }">
                    <Combobox
                        v-for="index in isRange ? [0, 1] : [0]"
                        :key="index"
                        v-bind="panelFns(index)"
                        :defaultIsAM="index === 0"
                        :format="format"
                        :hideDisabledOptions="props.hideDisabledOptions"
                        :hourStep="props.hourStep"
                        :minuteStep="props.minuteStep"
                        :prefixCls="`${prefix}-panel`"
                        :scrollItemProps="props.scrollItemProps"
                        :secondStep="props.secondStep"
                        :timeStampValue="state.value[index]"
                        :use12Hours="props.use12Hours"
                        @change="foundation.handlePanelChange($event, index)"
                    >
                        <template #panelHeader>
                            <slot v-if="hasPanel(index)" :index="index" name="panel" />
                            <slot v-else-if="$slots.panelHeader" :index="index" name="panelHeader" />
                            <template v-else-if="isRange">
                                {{ index === 0 ? locale.locale.begin : locale.locale.end }}
                            </template>
                        </template>
                        <template #panelFooter>
                            <slot v-if="hasPanel(index)" :index="index" name="panel" />
                            <slot v-else :index="index" name="panelFooter" />
                        </template>
                    </Combobox>
                </div>
            </template>
            <!-- the wrapper is what Popover binds to; Tooltip would add tabindex 0 here -->
            <div
                v-if="$slots.trigger"
                ref="trigger"
                :aria-controls="isTriggerButton() ? panelId : undefined"
                :aria-disabled="isTriggerButton() ? props.disabled : undefined"
                :aria-expanded="isTriggerButton() ? open : undefined"
                :aria-haspopup="isTriggerButton() ? 'dialog' : undefined"
                :role="isTriggerButton() ? 'button' : undefined"
                :tabindex="isTriggerButton() && !props.disabled ? 0 : -1"
                @keydown="onTriggerKeyDown"
            >
                <slot name="trigger" v-bind="triggerSlotProps()" />
            </div>
            <!-- the input is the Tab stop; Tooltip would add tabindex 0 here -->
            <span v-else :class="`${prefix}-header`" tabindex="-1">
                <TimeInput
                    v-bind="splitControlAttrs($attrs, isNotClassOrStyle).control"
                    :aria-controls="panelId"
                    :aria-expanded="open"
                    aria-haspopup="dialog"
                    :autofocus="props.autofocus"
                    :borderless="props.borderless"
                    :disabled="props.disabled"
                    :focusOnOpen="props.focusOnOpen"
                    :inputReadOnly="props.inputReadOnly"
                    :insetLabelId="props.insetLabelId"
                    :invalid="state.invalid"
                    :modelValue="state.inputValue"
                    :placeholder="placeholder || locale.locale.placeholder[props.type]"
                    :preventScroll="props.preventScroll"
                    role="combobox"
                    :showClear="props.disabled ? false : props.showClear"
                    :size="props.size"
                    :style="props.inputStyle"
                    :validateStatus="props.validateStatus"
                    @blur="foundation.handleInputBlur()"
                    @focus="foundation.handleFocus($event)"
                    @update:modelValue="foundation.handleInputChange($event)"
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
                </TimeInput>
            </span>
        </Popover>
    </div>
</template>
