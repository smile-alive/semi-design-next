<script setup lang="ts">
    import { computed, onDeactivated, onMounted, onUpdated, shallowRef, useId, useTemplateRef, watch } from 'vue';
    import { isEqual } from 'es-toolkit';
    import getYearMonthFromValue from '@fibrae/semi-foundation/date-picker/_utils/get-year-month-from-value';
    import { isRangeType, isRangeValueComplete, isYearOrMonthType, needConfirm } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/date-picker/constants';
    import DatePickerFoundation, { type DatePickerAdapter, type DatePickerFoundationProps, type DatePickerFoundationState } from '@fibrae/semi-foundation/date-picker/foundation';
    import type { RangeInput } from '@fibrae/semi-foundation/date-picker/input-foundation';
    import type { PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
    import { isInnerControlKey } from '@fibrae/semi-foundation/utils/a11y';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/date-picker/date-picker.scss';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useClickOutside from '../_base/use-click-outside';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import { provideInputGroupContext } from '../input/context';
    import useGroupLooks from '../input/use-group-looks';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover/popover.vue';
    import { useNestedPopups } from '../tooltip/context';
    import DateInput from './date-input.vue';
    import Footer from './footer.vue';
    import type { DatePickerEmits, DatePickerHandle, DatePickerProps, DatePickerSlots, DatePickerTriggerSlotProps } from './interface';
    import MonthsGrid from './months-grid.vue';
    import QuickControl from './quick-control.vue';
    import YearAndMonth from './year-and-month.vue';

    // The root takes class, style and the other attributes; the field state goes to the input that gets the focus.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<DatePickerProps & /* @vue-ignore */ ElementProps<'div', keyof DatePickerProps | EmitHandlers<DatePickerEmits>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('DatePicker', 'defaultValue'),
        open: undefined,
        defaultOpen: () => semiDefault('DatePicker', 'defaultOpen', false),
        type: () => semiDefault('DatePicker', 'type', 'date'),
        format: semiGlobalDefault('DatePicker', 'format'),
        defaultPickerValue: semiGlobalDefault('DatePicker', 'defaultPickerValue'),
        multiple: () => semiDefault('DatePicker', 'multiple', false),
        max: semiGlobalDefault('DatePicker', 'max'),
        needConfirm: () => semiDefault('DatePicker', 'needConfirm', false),
        // size and disabled resolve own value -> InputGroup -> global default in useGroupLooks
        disabled: undefined,
        // Function-typed props cannot take a factory default; the global defaults are read in the computed below.
        disabledDate: undefined,
        disabledTime: undefined,
        disabledTimePicker: () => semiDefault('DatePicker', 'disabledTimePicker', false),
        hideDisabledOptions: () => semiDefault('DatePicker', 'hideDisabledOptions', false),
        startDateOffset: undefined,
        endDateOffset: undefined,
        placeholder: semiGlobalDefault('DatePicker', 'placeholder'),
        rangeSeparator: () => semiDefault('DatePicker', 'rangeSeparator', strings.DEFAULT_SEPARATOR_RANGE),
        size: undefined,
        density: () => semiDefault('DatePicker', 'density', 'default'),
        borderless: () => semiDefault('DatePicker', 'borderless', false),
        showClear: () => semiDefault('DatePicker', 'showClear', true),
        inputReadOnly: () => semiDefault('DatePicker', 'inputReadOnly', false),
        inputStyle: semiGlobalDefault('DatePicker', 'inputStyle'),
        insetInput: () => semiDefault('DatePicker', 'insetInput', false),
        insetLabelId: undefined,
        validateStatus: semiGlobalDefault('DatePicker', 'validateStatus'),
        autofocus: () => semiDefault('DatePicker', 'autofocus', false),
        preventScroll: semiGlobalDefault('DatePicker', 'preventScroll'),
        weekStartsOn: () => semiDefault('DatePicker', 'weekStartsOn', numbers.WEEK_START_ON),
        startYear: semiGlobalDefault('DatePicker', 'startYear'),
        endYear: semiGlobalDefault('DatePicker', 'endYear'),
        autoSwitchDate: () => semiDefault('DatePicker', 'autoSwitchDate', true),
        syncSwitchMonth: () => semiDefault('DatePicker', 'syncSwitchMonth', false),
        presets: semiGlobalDefault('DatePicker', 'presets'),
        presetPosition: () => semiDefault('DatePicker', 'presetPosition', 'bottom'),
        timePickerOpts: semiGlobalDefault('DatePicker', 'timePickerOpts'),
        yearAndMonthOpts: semiGlobalDefault('DatePicker', 'yearAndMonthOpts'),
        // read in the computed below: ConfigProvider's timeZone comes before the global default
        timeZone: undefined,
        motion: () => semiDefault('DatePicker', 'motion', true),
        autoAdjustOverflow: () => semiDefault('DatePicker', 'autoAdjustOverflow', true),
        position: semiGlobalDefault('DatePicker', 'position'),
        spacing: semiGlobalDefault('DatePicker', 'spacing'),
        stopPropagation: () => semiDefault('DatePicker', 'stopPropagation', true),
        dropdownClassName: semiGlobalDefault('DatePicker', 'dropdownClassName'),
        dropdownStyle: semiGlobalDefault('DatePicker', 'dropdownStyle'),
    });

    const emit = defineEmits<DatePickerEmits>();
    const slots = defineSlots<DatePickerSlots>();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('DatePicker');

    const root = useTemplateRef('root');
    const combobox = useTemplateRef('combobox');
    const panel = useTemplateRef('panel');
    const triggerInput = useTemplateRef('triggerInput');
    const insetDateInput = useTemplateRef('insetDateInput');
    const monthsGrid = useTemplateRef('monthsGrid');
    const panelId = useId();

    // A custom trigger is user markup: only the rendered DOM tells whether it brings its own focus target.
    // Known limitation: measured only after this component renders; a trigger child that later updates its own DOM
    // leaves the measurement stale. Upgrade to a MutationObserver on the wrapper if such triggers need support.
    const customTriggerFocusable = shallowRef(false);

    const looks = useGroupLooks('DatePicker', props, { size: 'default', disabled: false });

    const prefix = cssClasses.PREFIX;
    const normalized = computed(() => DatePickerFoundation.normalizeProps(props));
    const type = computed(() => normalized.value.type);
    const rangeSeparator = computed(() => normalized.value.rangeSeparator);
    const position = computed(() => normalized.value.position ?? (config.value.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));
    const spacing = computed(() => normalized.value.spacing);
    const timeZone = computed(() => props.timeZone ?? config.value.timeZone ?? readSemiDefault(semi, 'DatePicker', 'timeZone'));
    const confirmNeeded = computed(() => needConfirm({ type: type.value, needConfirm: props.needConfirm }));
    const isYearOrMonth = computed(() => isYearOrMonthType(type.value));

    const placeholder = computed(() => {
        const value = props.placeholder || (locale.value.locale.placeholder as Record<string, string | string[] | undefined>)[type.value] || '';
        // The #trigger slot receives this value, and h() normalizes array children in place, which would rewrite the
        // shared locale pack
        return Array.isArray(value) ? [...value] : value;
    });

    const hasPresets = computed(() => Boolean(props.presets?.length));

    const quickControlProps = computed(() => ({
        insetInput: props.insetInput,
        locale: locale.value.locale,
        presetPosition: props.presetPosition,
        presets: props.presets,
        type: type.value,
    }));

    // tabindex, which Tooltip adds to its child, belongs to the input, the Tab stop
    const controlKeys = ['aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required', 'tabindex'];

    // the Inputs inside are parts of this control, not members of the group
    provideInputGroupContext(undefined);

    const enabledDate = () => false;

    const disabledDate = computed(() => props.disabledDate ?? readSemiDefault(semi, 'DatePicker', 'disabledDate') ?? enabledDate);

    const noDisabledTime = () => ({});

    const disabledTime = computed(() => props.disabledTime ?? readSemiDefault(semi, 'DatePicker', 'disabledTime') ?? noDisabledTime);

    const customTrigger = () => undefined;

    // Vue's StyleValue (dropdownStyle) is wider than the foundation's Record<string, any>, so the props type does not match.
    const { foundation, state } = useFoundation<DatePickerFoundation, DatePickerAdapter, DatePickerFoundationProps, DatePickerFoundationState>(
        DatePickerFoundation,
        props as unknown as Readonly<Partial<DatePickerFoundationProps>>,
        (view) => ({
            panelShow: Boolean(view.open || view.defaultOpen),
            isRange: false,
            // the value the first render shows, so the server HTML and hydration agree without waiting for init
            ...DatePickerFoundation.getInitialState(view),
            autofocus: Boolean(view.autoFocus || (isRangeType(view.type) && !slots.trigger && (view.open || view.defaultOpen))),
            insetInputValue: null,
            triggerDisabled: null,
            focusRecords: { rangeStart: false, rangeEnd: false },
        }),
        (base) => {
            // the inset inputs of the panel take the range focus while there are any
            const rangeInputs = () => insetDateInput.value ?? triggerInput.value;
            const setRangeInputFocus: DatePickerAdapter['setRangeInputFocus'] = (rangeInputFocus) => {
                // the focus comes first: the focus handler still reads the previous rangeInputFocus
                if (rangeInputFocus === 'rangeStart') {
                    rangeInputs()?.rangeStart?.focus({ preventScroll: props.preventScroll });
                } else if (rangeInputFocus === 'rangeEnd') {
                    rangeInputs()?.rangeEnd?.focus({ preventScroll: props.preventScroll });
                }
                if (rangeInputFocus !== base.getState('rangeInputFocus')) {
                    base.setState({ rangeInputFocus });
                }
            };

            return {
                togglePanel: (panelShow, callback) => base.setState({ panelShow }, callback),
                notifyBlur: (event) => emit('blur', event),
                notifyFocus: (event, rangeType) => emit('focus', event, rangeType || undefined),
                notifyClear: (event) => emit('clear', event),
                notifyChange: (date, dateString) => {
                    emit('update:modelValue', date);
                    emit('change', date, dateString);
                },
                notifyCancel: (date, dateString) => emit('cancel', date, dateString),
                notifyConfirm: (date, dateString) => emit('confirm', date, dateString),
                notifyOpenChange: (open) => {
                    emit('update:open', open);
                    emit('openChange', open);
                },
                notifyClickOutSide: (event) => emit('clickOutSide', event),
                notifyPresetsClick: (item, event) => emit('presetClick', item, event),
                updateValue: (value) => base.setState({ value }),
                updatePrevTimezone: (prevTimeZone) => base.setState({ prevTimeZone }),
                updateCachedSelectedValue: (cachedSelectedValue) => base.setState({ cachedSelectedValue }),
                updateInputValue: (inputValue) => base.setState({ inputValue }),
                updateInsetInputValue: (insetInputValue) => {
                    if (props.insetInput && !isEqual(insetInputValue, base.getState('insetInputValue'))) {
                        base.setState({ insetInputValue });
                    }
                },
                setRangeInputFocus,
                isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panel.value),
                isEventTarget: (event) => Boolean(event && event.target === event.currentTarget),
                setInsetInputFocus: () => {
                    const target = base.getState('rangeInputFocus') === 'rangeEnd' ? rangeInputs()?.rangeEnd : rangeInputs()?.rangeStart;
                    if (target && FocusTrapHandle.getActiveElement(target.input) !== target.input) {
                        target.focus({ preventScroll: props.preventScroll });
                    }
                },
                setInputFocus: () => triggerInput.value?.input?.focus({ preventScroll: props.preventScroll }),
                setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(combobox.value, { preventScroll: props.preventScroll }),
                blurFocusedElement: () => {
                    const active = FocusTrapHandle.getActiveElement(root.value);
                    if (active instanceof HTMLElement && (root.value?.contains(active) || panel.value?.contains(active))) {
                        active.blur();
                    }
                },
                setTriggerDisabled: (triggerDisabled, callback) => base.setState({ triggerDisabled }, callback),
            };
        },
        {
            props: {
                size: () => looks.size,
                disabled: () => looks.disabled,
                value: () => props.modelValue,
                type: () => type.value,
                rangeSeparator: () => rangeSeparator.value,
                timeZone: () => timeZone.value,
                disabledDate: () => disabledDate.value,
                disabledTime: () => disabledTime.value,
                startDateOffset: () => props.startDateOffset ?? readSemiDefault(semi, 'DatePicker', 'startDateOffset'),
                endDateOffset: () => props.endDateOffset ?? readSemiDefault(semi, 'DatePicker', 'endDateOffset'),
                autoFocus: () => props.autofocus,
                triggerRender: () => (slots.trigger ? customTrigger : undefined),
                dateFnsLocale: () => locale.value.dateFnsLocale,
            },
        }
    );

    const panelShow = computed(() => DatePickerFoundation.isPanelShown({ open: props.open, disabled: looks.disabled }, state.value));
    const inputDisabled = computed(() => looks.disabled || Boolean(props.insetInput && state.value.triggerDisabled));
    const triggerName = computed(() => (state.value.value.length ? locale.value.locale.changeDate : locale.value.locale.chooseDate));
    const yearMonth = computed(() => getYearMonthFromValue(state.value.value, type.value));
    const confirmDisabled = computed(() => isRangeType(type.value) && !isRangeValueComplete(state.value.cachedSelectedValue));

    const insetDateInputProps = computed(() => ({
        dateFnsLocale: locale.value.dateFnsLocale,
        defaultPickerValue: props.defaultPickerValue,
        density: props.density,
        format: props.format,
        insetInput: props.insetInput,
        insetInputValue: state.value.insetInputValue,
        rangeSeparator: rangeSeparator.value,
        type: type.value,
        value: state.value.value,
    }));

    const measureCustomTrigger = () => {
        if (slots.trigger && combobox.value) {
            customTriggerFocusable.value = FocusTrapHandle.getFocusableElements(combobox.value).length > 0;
        }
    };

    // A custom trigger without a focus target of its own leaves the wrapper as the Tab stop, which then is the button
    // that opens the panel; Popover adds its popup state. Slots are not reactive, so this is read while rendering.
    const isTriggerButton = () => Boolean(slots.trigger) && !customTriggerFocusable.value;

    const isControlKey = (key: string) => controlKeys.includes(key);

    // A range with a custom trigger has no range inputs. The root's :role comes after its v-bind and would clear a role
    // the user passed, so it keeps that role and adds group only to a root without one.
    const hasRangeInputs = () => isRangeType(type.value) && !slots.trigger;

    const rootLabelledby = (a: Record<string, unknown>) => (hasRangeInputs() ? (a['aria-labelledby'] as string | undefined) : undefined);

    const rootRole = (a: Record<string, unknown>) => (a.role as string | undefined) ?? (hasRangeInputs() || a['aria-label'] ? 'group' : undefined);

    const comboboxClass = () => {
        const range = hasRangeInputs();
        return [
            `${prefix}-input`,
            {
                [`${prefix}-range-input`]: range,
                [`${prefix}-range-input-${looks.size}`]: range && looks.size,
                [`${prefix}-range-input-active`]: range && state.value.rangeInputFocus && !inputDisabled.value,
                [`${prefix}-range-input-disabled`]: range && inputDisabled.value,
                [`${prefix}-range-input-${props.validateStatus}`]: range && props.validateStatus,
                [`${prefix}-borderless`]: props.borderless,
            },
        ];
    };

    const disabledDisposeDate = (date: Date, options?: unknown) => foundation.disabledDisposeDate(date, options);

    const disabledDisposeTime = (date: Date | Date[], panelType: PanelType) => foundation.disabledDisposeTime(date, panelType);

    const focusInsetDate = (event: FocusEvent, rangeType: RangeInput) => {
        monthsGrid.value?.showDatePanel(strings.PANEL_TYPE_LEFT);
        monthsGrid.value?.showDatePanel(strings.PANEL_TYPE_RIGHT);
        foundation.handleInputFocus(event, rangeType);
    };

    const focusInsetTime = () => {
        monthsGrid.value?.showTimePicker(strings.PANEL_TYPE_LEFT);
        monthsGrid.value?.showTimePicker(strings.PANEL_TYPE_RIGHT);
    };

    const onTriggerKeyDown = (event: KeyboardEvent) => {
        // a control inside the trigger (the range clear button, a custom trigger's own) keeps its keys
        if (!isInnerControlKey(event)) {
            foundation.handleTriggerKeyDown(event, isTriggerButton() && event.target === event.currentTarget);
        }
    };

    const triggerSlotProps = (): DatePickerTriggerSlotProps => ({
        value: state.value.value,
        inputValue: state.value.inputValue,
        placeholder: placeholder.value,
        disabled: inputDisabled.value,
        size: looks.size,
        inputReadOnly: props.inputReadOnly || Boolean(props.insetInput),
        rangeInputFocus: state.value.rangeInputFocus,
        type: type.value,
        format: props.format,
        multiple: props.multiple,
        autofocus: state.value.autofocus,
        componentProps: { ...props, ...looks },
        onChange: (inputValue) => foundation.handleInputChange(inputValue, undefined),
        onEnterPress: foundation.handleInputComplete,
        onClear: foundation.handleInputClear,
    });

    useClickOutside([root, panel], foundation.handleClickOutside, panelShow, useNestedPopups());

    useDidUpdate(
        () => ({ value: props.modelValue, timeZone: timeZone.value }),
        (current, previous) => {
            if (!isEqual(current.value, previous.value)) {
                foundation.initFromProps({ value: current.value, timeZone: current.timeZone });
            } else {
                foundation.initFromProps({
                    value: foundation.getState('value'),
                    timeZone: current.timeZone,
                    prevTimeZone: previous.timeZone,
                });
            }
        },
        (a, b) => isEqual(a.value, b.value) && a.timeZone === b.timeZone,
        'pre'
    );

    watch(
        () => props.open,
        (open) => {
            if (open) {
                foundation.handleControlledOpen();
            } else {
                foundation.handleControlledClose();
            }
        }
    );

    // isPanelShown is already false for a disabled picker, so the check passes `disabled: false`
    watch(
        () => looks.disabled,
        (disabled) => {
            if (disabled && DatePickerFoundation.isPanelShown({ open: props.open, disabled: false }, state.value)) {
                foundation.deactivate();
            }
        }
    );

    // The panel follows the foundation state, which a cached KeepAlive subtree would keep open. Closing it here is not
    // the user leaving the picker, so it fires no blur and returns no focus.
    onDeactivated(() => {
        if (panelShow.value) {
            foundation.deactivate();
        }
    });

    onMounted(measureCustomTrigger);
    onUpdated(measureCustomTrigger);

    defineExpose<DatePickerHandle>({
        open: foundation.open,
        close: () => foundation.close(),
        focus: foundation.focus,
        blur: foundation.blur,
    });
</script>

<template>
    <div ref="root" v-bind="splitControlAttrs($attrs, isControlKey).root" :aria-labelledby="rootLabelledby($attrs)" :class="prefix" :role="rootRole($attrs)">
        <Popover
            :ariaLabel="locale.locale.panel[type]"
            :autoAdjustOverflow="props.autoAdjustOverflow"
            :motion="props.motion"
            :position="position"
            :spacing="spacing"
            :stopPropagation="props.stopPropagation"
            trigger="custom"
            :visible="panelShow"
            @afterClose="foundation.handlePanelVisibleChange(false)"
            @escKeyDown="foundation.handleEscKeyDown"
            @open="foundation.handlePanelVisibleChange(true)"
        >
            <template #content>
                <div :id="panelId" ref="panel" :class="[prefix, { [cssClasses.PANEL_YAM]: isYearOrMonth, [`${prefix}-compact`]: props.density === 'compact' }, props.dropdownClassName]" :style="props.dropdownStyle" :x-type="type">
                    <div :class="`${prefix}-container`">
                        <div v-if="$slots.leftSlot" :class="`${prefix}-leftSlot`" x-semi-prop="leftSlot">
                            <slot name="leftSlot" />
                        </div>
                        <div>
                            <div v-if="$slots.topSlot" :class="`${prefix}-topSlot`" x-semi-prop="topSlot">
                                <slot name="topSlot" />
                            </div>
                            <!-- monthRange does not support presetPosition -->
                            <QuickControl v-if="props.presetPosition === 'top' && type !== 'monthRange'" v-bind="quickControlProps" @presetClick="foundation.handlePresetClick" />
                            <YearAndMonth
                                v-if="isYearOrMonth"
                                :currentMonth="yearMonth.month"
                                :currentYear="yearMonth.year"
                                :density="props.density"
                                :disabledDate="disabledDisposeDate"
                                :endYear="props.endYear"
                                :locale="locale.locale"
                                monthCycled
                                noBackBtn
                                :presetPosition="props.presetPosition"
                                :startYear="props.startYear"
                                :type="type"
                                :yearAndMonthOpts="props.yearAndMonthOpts"
                                @select="foundation.handleYMSelectedChange"
                            >
                                <template v-if="props.insetInput" #dateInput>
                                    <DateInput ref="insetDateInput" v-bind="insetDateInputProps" @insetDateFocus="focusInsetDate" @insetInputChange="foundation.handleInsetInputChange" @insetTimeFocus="focusInsetTime" />
                                </template>
                                <template v-if="hasPresets" #quickControls>
                                    <QuickControl v-bind="quickControlProps" @presetClick="foundation.handlePresetClick" />
                                </template>
                            </YearAndMonth>
                            <MonthsGrid
                                v-else
                                ref="monthsGrid"
                                :autoSwitchDate="props.autoSwitchDate"
                                :dateFnsLocale="locale.dateFnsLocale"
                                :defaultPickerValue="props.defaultPickerValue"
                                :density="props.density"
                                :disabledDate="disabledDisposeDate"
                                :disabledTime="disabledDisposeTime"
                                :disabledTimePicker="props.disabledTimePicker"
                                :endDateOffset="props.endDateOffset ?? readSemiDefault(semi, 'DatePicker', 'endDateOffset')"
                                :endYear="props.endYear"
                                :focusRecords="state.focusRecords"
                                :format="props.format"
                                :hasOtherRangeInputBeenFocused="foundation.hasOtherRangeInputBeenFocused"
                                :hasPresets="hasPresets"
                                :hideDisabledOptions="props.hideDisabledOptions"
                                :insetInput="props.insetInput"
                                :isControlledComponent="!confirmNeeded && props.modelValue !== undefined"
                                :locale="locale.locale"
                                :max="props.max"
                                :multiple="props.multiple"
                                :presetPosition="props.presetPosition"
                                :rangeInputFocus="state.rangeInputFocus"
                                :selectedValue="state.cachedSelectedValue"
                                :startDateOffset="props.startDateOffset ?? readSemiDefault(semi, 'DatePicker', 'startDateOffset')"
                                :startYear="props.startYear"
                                :syncSwitchMonth="props.syncSwitchMonth"
                                :timePickerOpts="props.timePickerOpts"
                                :timeZone="timeZone"
                                :type="type"
                                :weekStartsOn="props.weekStartsOn"
                                :yearAndMonthOpts="props.yearAndMonthOpts"
                                @change="foundation.handleSelectedChange"
                                @panelChange="(...args) => emit('panelChange', ...args)"
                                @rangeInputFocus="foundation.handleSetRangeFocus"
                            >
                                <template v-if="props.insetInput" #dateInput>
                                    <DateInput ref="insetDateInput" v-bind="insetDateInputProps" @insetDateFocus="focusInsetDate" @insetInputChange="foundation.handleInsetInputChange" @insetTimeFocus="focusInsetTime" />
                                </template>
                                <template v-if="hasPresets" #quickControls>
                                    <QuickControl v-bind="quickControlProps" @presetClick="foundation.handlePresetClick" />
                                </template>
                                <template v-if="$slots.date" #date="slotProps">
                                    <slot name="date" v-bind="slotProps" />
                                </template>
                                <template v-if="$slots.fullDate" #fullDate="slotProps">
                                    <slot name="fullDate" v-bind="slotProps" />
                                </template>
                            </MonthsGrid>
                            <QuickControl v-if="props.presetPosition === 'bottom' && type !== 'monthRange'" v-bind="quickControlProps" @presetClick="foundation.handlePresetClick" />
                            <div v-if="$slots.bottomSlot" :class="`${prefix}-bottomSlot`" x-semi-prop="bottomSlot">
                                <slot name="bottomSlot" />
                            </div>
                        </div>
                        <div v-if="$slots.rightSlot" :class="`${prefix}-rightSlot`" x-semi-prop="rightSlot">
                            <slot name="rightSlot" />
                        </div>
                    </div>
                    <Footer v-if="confirmNeeded" :disabledConfirm="confirmDisabled" :locale="locale.locale" @cancel="foundation.handleCancel" @confirm="foundation.handleConfirm" />
                </div>
            </template>
            <!-- The inputs, or a focusable custom trigger, are the Tab stop; Tooltip would add tabindex 0 here. -->
            <div
                ref="combobox"
                :aria-describedby="isTriggerButton() ? ($attrs['aria-describedby'] as string | undefined) : undefined"
                :aria-disabled="isTriggerButton() ? looks.disabled : undefined"
                :aria-errormessage="isTriggerButton() ? ($attrs['aria-errormessage'] as string | undefined) : undefined"
                :aria-invalid="isTriggerButton() ? ($attrs['aria-invalid'] as boolean | undefined) : undefined"
                :aria-label="isTriggerButton() && !$attrs['aria-labelledby'] ? triggerName : undefined"
                :aria-labelledby="isTriggerButton() ? ($attrs['aria-labelledby'] as string | undefined) : undefined"
                :class="comboboxClass()"
                :role="isTriggerButton() ? 'button' : undefined"
                :tabindex="isTriggerButton() && !looks.disabled ? 0 : -1"
                @click="foundation.handleTriggerClick($event, Boolean($slots.trigger))"
                @keydown="onTriggerKeyDown"
            >
                <slot v-if="$slots.trigger" name="trigger" v-bind="triggerSlotProps()" />
                <DateInput
                    v-else
                    ref="triggerInput"
                    v-bind="splitControlAttrs($attrs, isControlKey).control"
                    :aria-controls="panelId"
                    :aria-expanded="panelShow"
                    aria-haspopup="dialog"
                    :aria-label="$attrs['aria-labelledby'] ? undefined : triggerName"
                    :autofocus="state.autofocus"
                    :borderless="isRangeType(type) ? false : props.borderless"
                    :dateFnsLocale="locale.dateFnsLocale"
                    :defaultPickerValue="props.defaultPickerValue"
                    :disabled="inputDisabled"
                    :format="props.format"
                    :inputReadOnly="props.inputReadOnly || Boolean(props.insetInput)"
                    :inputStyle="props.inputStyle"
                    :inputValue="state.inputValue"
                    :insetLabelId="props.insetLabelId"
                    :placeholder="placeholder"
                    :rangeInputFocus="state.rangeInputFocus"
                    :rangeSeparator="rangeSeparator"
                    role="combobox"
                    :showClear="props.showClear"
                    :showClearIgnoreDisabled="Boolean(props.insetInput)"
                    :size="looks.size"
                    :type="type"
                    :validateStatus="props.validateStatus"
                    :value="state.value"
                    @change="foundation.handleInputChange"
                    @clear="foundation.handleInputClear"
                    @enterPress="foundation.handleInputComplete"
                    @focus="(event, range) => foundation.handleInputFocus(event, range as RangeInput)"
                    @rangeClear="foundation.handleRangeInputClear"
                    @rangeEndTabPress="foundation.handleRangeEndTabPress"
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
                    <template v-if="$slots.rangeSeparator" #rangeSeparator>
                        <slot name="rangeSeparator" />
                    </template>
                </DateInput>
            </div>
        </Popover>
    </div>
</template>
