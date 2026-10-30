<script lang="ts">
    import { onMount } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import getYearMonthFromValue from '@fibrae/semi-foundation/date-picker/_utils/get-year-month-from-value';
    import { isRangeType, isRangeValueComplete, isYearOrMonthType, needConfirm as isConfirmNeeded } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/date-picker/constants';
    import DatePickerFoundation, { type DatePickerAdapter, type DatePickerFoundationProps, type DatePickerFoundationState } from '@fibrae/semi-foundation/date-picker/foundation';
    import type { RangeInput } from '@fibrae/semi-foundation/date-picker/input-foundation';
    import type { PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
    import { isInnerControlKey } from '@fibrae/semi-foundation/utils/a11y';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/date-picker/date-picker.scss';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import useClickOutside from '../_base/use-click-outside.svelte.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { useConfig } from '../config-provider/index.js';
    import { getInputGroupInScope, setInputGroupContext } from '../input/context.js';
    import { useLocale } from '../locale/index.js';
    import { Popover } from '../popover/index.js';
    import { useNestedPopups } from '../tooltip/context.js';
    import DateInput from './date-input.svelte';
    import Footer from './footer.svelte';
    import type { DatePickerProps, DatePickerTriggerRenderProps } from './interface.js';
    import MonthsGrid from './months-grid.svelte';
    import QuickControl from './quick-control.svelte';
    import YearAndMonth from './year-and-month.svelte';

    const defaults = useDefaultProps('DatePicker');

    // No fallback on `value` and `open`: a bound `undefined` (form reset, back to uncontrolled) would throw with one.
    // `open` is renamed so the exported open() method can keep its name.
    let {
        value = $bindable(),
        open: openProp = $bindable(),
        type: typeProp = defaults('type', 'date'),
        format = defaults('format'),
        defaultPickerValue = defaults('defaultPickerValue'),
        multiple = defaults('multiple', false),
        max = defaults('max'),
        needConfirm = defaults('needConfirm', false),
        disabled: disabledProp,
        disabledDate = defaults('disabledDate'),
        disabledTime = defaults('disabledTime'),
        disabledTimePicker = defaults('disabledTimePicker', false),
        hideDisabledOptions = defaults('hideDisabledOptions', false),
        startDateOffset = defaults('startDateOffset'),
        endDateOffset = defaults('endDateOffset'),
        placeholder = defaults('placeholder'),
        rangeSeparator: rangeSeparatorProp = defaults('rangeSeparator', strings.DEFAULT_SEPARATOR_RANGE),
        size: sizeProp,
        density = defaults('density', 'default'),
        borderless = defaults('borderless', false),
        showClear = defaults('showClear', true),
        inputReadOnly = defaults('inputReadOnly', false),
        inputStyle = defaults('inputStyle'),
        insetInput = defaults('insetInput', false),
        insetLabelId,
        validateStatus = defaults('validateStatus'),
        autofocus = defaults('autofocus', false),
        preventScroll = defaults('preventScroll'),
        weekStartsOn = defaults('weekStartsOn', numbers.WEEK_START_ON),
        startYear = defaults('startYear'),
        endYear = defaults('endYear'),
        autoSwitchDate = defaults('autoSwitchDate', true),
        syncSwitchMonth = defaults('syncSwitchMonth', false),
        presets = defaults('presets'),
        presetPosition = defaults('presetPosition', 'bottom'),
        timePickerOpts = defaults('timePickerOpts'),
        yearAndMonthOpts = defaults('yearAndMonthOpts'),
        // read below: ConfigProvider's timeZone comes before the global default
        timeZone,
        motion = defaults('motion', true),
        autoAdjustOverflow = defaults('autoAdjustOverflow', true),
        position: positionProp = defaults('position'),
        spacing: spacingProp = defaults('spacing'),
        stopPropagation = defaults('stopPropagation', true),
        dropdownClassName = defaults('dropdownClassName'),
        dropdownStyle = defaults('dropdownStyle'),
        onChange,
        onOpenChange,
        onFocus,
        onBlur,
        onClear,
        onCancel,
        onConfirm,
        onPanelChange,
        onPresetClick,
        onClickOutSide,
        trigger,
        date,
        fullDate,
        topSlot,
        bottomSlot,
        leftSlot,
        rightSlot,
        prefix,
        insetLabel,
        clearIcon,
        rangeSeparatorNode,
        ...rest
    }: DatePickerProps = $props();

    const config = useConfig();
    const locale = useLocale('DatePicker');

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let combobox = $state<HTMLDivElement>();
    let panelElement = $state<HTMLDivElement>();
    let triggerInput = $state<DateInput>();
    let insetDateInput = $state<DateInput>();
    let monthsGrid = $state<MonthsGrid>();

    // A trigger snippet is user markup: only the rendered DOM tells whether it brings its own focus target.
    // Known limitation: measured once on mount; a trigger that later gains or loses a focusable element leaves the
    // measurement stale. Upgrade to a MutationObserver on the wrapper if such triggers need support.
    let customTriggerFocusable = $state(false);

    // The value and timeZone the foundation last synced from, to tell a new value from an equal one written back
    let synced: { value: DatePickerProps['value']; timeZone?: string | number } | undefined;

    // an InputGroup supplies size and disabled when the control is given none; the controls inside this one must not read it again
    const group = getInputGroupInScope();
    const disabled = $derived(disabledProp ?? group?.disabled ?? defaults('disabled') ?? false);
    const size = $derived(sizeProp ?? group?.size ?? defaults('size', 'default'));
    const normalized = $derived(DatePickerFoundation.normalizeProps({ type: typeProp, format, rangeSeparator: rangeSeparatorProp, insetInput, position: positionProp, spacing: spacingProp }));
    const type = $derived(normalized.type);
    const rangeSeparator = $derived(normalized.rangeSeparator);
    const zone = $derived(timeZone ?? config.timeZone ?? defaults('timeZone'));
    const prefixCls = cssClasses.PREFIX;
    const panelId = `${uid}-panel`;

    // tabindex, which Tooltip adds to its child, belongs to the input, the Tab stop
    const controlKeys = ['aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required', 'tabindex'];
    const position = $derived(normalized.position ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));
    const confirmNeeded = $derived(isConfirmNeeded({ type, needConfirm }));
    const isYearOrMonth = $derived(isYearOrMonthType(type));
    const shownPlaceholder = $derived(placeholder || (locale().locale.placeholder as Record<string, string | string[] | undefined>)[type] || '');
    const hasPresets = $derived(Boolean(presets?.length));
    const isTriggerButton = $derived(Boolean(trigger) && !customTriggerFocusable);

    // A range with a custom trigger has no range inputs
    const hasRangeInputs = $derived(isRangeType(type) && !trigger);
    const attrs = $derived(splitControlAttrs(rest, (key) => controlKeys.includes(key)));
    const rootRole = $derived((rest.role as string | undefined) ?? (hasRangeInputs || rest['aria-label'] ? 'group' : undefined));

    setInputGroupContext(undefined);

    const enabledDate = () => false;

    const shownDisabledDate = $derived(disabledDate ?? enabledDate);

    const noDisabledTime = () => ({});

    const shownDisabledTime = $derived(disabledTime ?? noDisabledTime);

    const customTrigger = () => undefined;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: DatePickerFoundationProps = {
        get value() {
            return value;
        },
        get open() {
            return openProp;
        },
        get type() {
            return type;
        },
        get format() {
            return format;
        },
        get multiple() {
            return multiple;
        },
        get max() {
            return max;
        },
        get needConfirm() {
            return needConfirm;
        },
        get disabled() {
            return disabled;
        },
        get disabledDate() {
            return shownDisabledDate;
        },
        get disabledTime() {
            return shownDisabledTime;
        },
        get startDateOffset() {
            return startDateOffset;
        },
        get endDateOffset() {
            return endDateOffset;
        },
        get rangeSeparator() {
            return rangeSeparator;
        },
        get timeZone() {
            return zone;
        },
        get autoFocus() {
            return autofocus;
        },
        // the foundation tells a custom trigger by a function here
        get triggerRender() {
            return trigger ? customTrigger : undefined;
        },
        get dateFnsLocale() {
            return locale().dateFnsLocale;
        },
        get insetInput() {
            return insetInput;
        },
        get defaultPickerValue() {
            return defaultPickerValue;
        },
        get presets() {
            return presets;
        },
    };

    const { foundation, states } = useFoundation<DatePickerFoundation, DatePickerAdapter, DatePickerFoundationProps, DatePickerFoundationState>(
        DatePickerFoundation,
        foundationProps,
        (view) => ({
            panelShow: Boolean(view.open),
            isRange: false,
            // the value the first render shows, so the server HTML and hydration agree without waiting for init
            ...DatePickerFoundation.getInitialState(view),
            autofocus: Boolean(view.autoFocus || (isRangeType(view.type) && !trigger && view.open)),
            insetInputValue: null,
            triggerDisabled: null,
            focusRecords: { rangeStart: false, rangeEnd: false },
        }),
        (base) => {
            // the inset inputs of the panel take the range focus while there are any
            const rangeInputs = () => insetDateInput ?? triggerInput;
            const setRangeInputFocus: DatePickerAdapter['setRangeInputFocus'] = (rangeInputFocus) => {
                // the focus comes first: the focus handler still reads the previous rangeInputFocus
                if (rangeInputFocus === 'rangeStart') {
                    rangeInputs()?.getRangeStart()?.focus({ preventScroll });
                } else if (rangeInputFocus === 'rangeEnd') {
                    rangeInputs()?.getRangeEnd()?.focus({ preventScroll });
                }
                if (rangeInputFocus !== base.getState('rangeInputFocus')) {
                    base.setState({ rangeInputFocus });
                }
            };

            return {
                togglePanel: (panelShow, callback) => base.setState({ panelShow }, callback),
                notifyBlur: (event) => onBlur?.(event),
                notifyFocus: (event, rangeType) => onFocus?.(event, rangeType || undefined),
                notifyClear: (event) => {
                    // a clear is no pending change: with needConfirm it commits at once, as notifyChange leaves the write to confirm
                    if (confirmNeeded) {
                        value = isRangeType(type) ? [] : undefined;
                    }
                    onClear?.(event);
                },
                notifyChange: (next, dateString) => {
                    // the bindable props are the source of truth: bound, the write reaches the parent; unbound, it overrides locally.
                    // With needConfirm a change is only pending, as the foundation keeps it out of an uncontrolled value,
                    // so the value is written on confirm and cancel can restore the old one in every binding mode.
                    if (!confirmNeeded) {
                        value = next;
                        // A written `value` makes the picker controlled, so the foundation state follows only on sync;
                        // one action may notify twice (toYearMonth with autoSwitchDate), and the second must see this one.
                        syncFoundation();
                    }
                    onChange?.(next, dateString);
                },
                notifyCancel: (next, dateString) => onCancel?.(next, dateString),
                notifyConfirm: (next, dateString) => {
                    value = next;
                    onConfirm?.(next, dateString);
                },
                notifyOpenChange: (next) => {
                    openProp = next;
                    onOpenChange?.(next);
                },
                notifyClickOutSide: (event) => onClickOutSide?.(event),
                notifyPresetsClick: (item, event) => onPresetClick?.(item, event),
                updateValue: (next) => base.setState({ value: next }),
                updatePrevTimezone: (prevTimeZone) => base.setState({ prevTimeZone }),
                updateCachedSelectedValue: (cachedSelectedValue) => base.setState({ cachedSelectedValue }),
                updateInputValue: (inputValue) => base.setState({ inputValue }),
                updateInsetInputValue: (insetInputValue) => {
                    if (insetInput && !isEqual(insetInputValue, base.getState('insetInputValue'))) {
                        base.setState({ insetInputValue });
                    }
                },
                setRangeInputFocus,
                isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panelElement),
                isEventTarget: (event) => Boolean(event && event.target === event.currentTarget),
                setInsetInputFocus: () => {
                    const target = base.getState('rangeInputFocus') === 'rangeEnd' ? rangeInputs()?.getRangeEnd() : rangeInputs()?.getRangeStart();
                    const input = target?.getInput();
                    if (target && FocusTrapHandle.getActiveElement(input) !== input) {
                        target.focus({ preventScroll });
                    }
                },
                setInputFocus: () => triggerInput?.getSingle()?.focus({ preventScroll }),
                setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(combobox, { preventScroll }),
                blurFocusedElement: () => {
                    const active = FocusTrapHandle.getActiveElement(root);
                    if (active instanceof HTMLElement && (root?.contains(active) || panelElement?.contains(active))) {
                        active.blur();
                    }
                },
                setTriggerDisabled: (triggerDisabled, callback) => base.setState({ triggerDisabled }, callback),
            };
        }
    );

    const panelShow = $derived(DatePickerFoundation.isPanelShown({ open: openProp, disabled }, states()));
    const inputDisabled = $derived(disabled || Boolean(insetInput && states().triggerDisabled));
    const triggerName = $derived(states().value.length ? locale().locale.changeDate : locale().locale.chooseDate);
    const yearMonth = $derived(getYearMonthFromValue(states().value, type));
    const confirmDisabled = $derived(isRangeType(type) && !isRangeValueComplete(states().cachedSelectedValue));

    const comboboxClass = $derived([
        `${prefixCls}-input`,
        {
            [`${prefixCls}-range-input`]: hasRangeInputs,
            [`${prefixCls}-range-input-${size}`]: hasRangeInputs && size,
            [`${prefixCls}-range-input-active`]: hasRangeInputs && states().rangeInputFocus && !inputDisabled,
            [`${prefixCls}-range-input-disabled`]: hasRangeInputs && inputDisabled,
            [`${prefixCls}-range-input-${validateStatus}`]: hasRangeInputs && validateStatus,
            [`${prefixCls}-borderless`]: borderless,
        },
    ]);

    const triggerProps: DatePickerTriggerRenderProps = $derived({
        value: states().value,
        inputValue: states().inputValue,
        placeholder: shownPlaceholder,
        disabled: inputDisabled,
        size,
        inputReadOnly: inputReadOnly || Boolean(insetInput),
        rangeInputFocus: states().rangeInputFocus,
        type,
        format,
        multiple,
        autofocus: states().autofocus,
        componentProps: {
            value,
            open: openProp,
            type: typeProp,
            format,
            defaultPickerValue,
            multiple,
            max,
            needConfirm,
            disabled,
            disabledDate,
            disabledTime,
            disabledTimePicker,
            hideDisabledOptions,
            startDateOffset,
            endDateOffset,
            rangeSeparator: rangeSeparatorProp,
            size,
            density,
            borderless,
            showClear,
            inputReadOnly,
            inputStyle,
            insetInput,
            insetLabelId,
            validateStatus,
            preventScroll,
            weekStartsOn,
            startYear,
            endYear,
            autoSwitchDate,
            syncSwitchMonth,
            presets,
            presetPosition,
            timePickerOpts,
            yearAndMonthOpts,
            timeZone,
            motion,
            autoAdjustOverflow,
            position: positionProp,
            spacing: spacingProp,
            stopPropagation,
            dropdownClassName,
            dropdownStyle,
        },
        onChange: (inputValue) => foundation.handleInputChange(inputValue, undefined),
        onEnterPress: foundation.handleInputComplete,
        onClear: foundation.handleInputClear,
    });

    const syncFoundation = () => {
        const next = { value, timeZone: zone };
        const previous = synced;
        synced = next;
        if (!previous) {
            return;
        }
        if (!isEqual(next.value, previous.value)) {
            foundation.initFromProps({ value: next.value, timeZone: next.timeZone });
        } else if (next.timeZone !== previous.timeZone) {
            foundation.initFromProps({ value: foundation.getState('value'), timeZone: next.timeZone, prevTimeZone: previous.timeZone });
        }
    };

    const focusInsetDate = (event: FocusEvent, rangeType: RangeInput) => {
        monthsGrid?.showDatePanel(strings.PANEL_TYPE_LEFT);
        monthsGrid?.showDatePanel(strings.PANEL_TYPE_RIGHT);
        foundation.handleInputFocus(event, rangeType);
    };

    const focusInsetTime = () => {
        monthsGrid?.showTimePicker(strings.PANEL_TYPE_LEFT);
        monthsGrid?.showTimePicker(strings.PANEL_TYPE_RIGHT);
    };

    const handleTriggerKeyDown = (event: KeyboardEvent) => {
        // a control inside the trigger (the range clear button, a custom trigger's own) keeps its keys
        if (!isInnerControlKey(event)) {
            foundation.handleTriggerKeyDown(event, isTriggerButton && event.target === event.currentTarget);
        }
    };

    useClickOutside([() => root, () => panelElement], foundation.handleClickOutside, () => panelShow, useNestedPopups());
    $effect(syncFoundation);

    watch(
        () => openProp,
        (next) => {
            if (next) {
                foundation.handleControlledOpen();
            } else {
                foundation.handleControlledClose();
            }
        }
    );

    // isPanelShown is already false for a disabled picker, so the check passes `disabled: false`
    watch(
        () => disabled,
        (next) => {
            if (next && DatePickerFoundation.isPanelShown({ open: openProp, disabled: false }, states())) {
                foundation.deactivate();
            }
        }
    );

    onMount(() => {
        if (trigger && combobox) {
            customTriggerFocusable = FocusTrapHandle.getFocusableElements(combobox).length > 0;
        }
    });

    /** Opens the panel; a bound `open` decides through its setter */
    export function open() {
        foundation.open();
        // once a user action wrote `open`, the prop (not the foundation state) decides whether the panel shows
        openProp = true;
    }

    /** Closes the panel; a bound `open` decides through its setter */
    export function close() {
        foundation.close();
        openProp = false;
    }

    /**
     * Focuses the input; a range focuses its start input unless `rangeEnd` is given. With `insetInput` and the panel
     * open the trigger is disabled, so the focus goes to the input in the panel. `preventScroll` applies
     */
    export function focus(focusType?: RangeInput) {
        foundation.focus(focusType);
    }

    export function blur() {
        foundation.blur();
    }
</script>

{#snippet quickControls()}
    <QuickControl {insetInput} locale={locale().locale} onPresetClick={foundation.handlePresetClick} {presetPosition} {presets} {type} />
{/snippet}

{#snippet insetDateInputSnippet()}
    <DateInput
        bind:this={insetDateInput}
        dateFnsLocale={locale().dateFnsLocale}
        {defaultPickerValue}
        {density}
        {format}
        {insetInput}
        insetInputValue={states().insetInputValue}
        onInsetDateFocus={focusInsetDate}
        onInsetInputChange={foundation.handleInsetInputChange}
        onInsetTimeFocus={focusInsetTime}
        {rangeSeparator}
        {type}
        value={states().value}
    />
{/snippet}

{#snippet content()}
    <div bind:this={panelElement} {...{ 'x-type': type }} class={[prefixCls, { [cssClasses.PANEL_YAM]: isYearOrMonth, [`${prefixCls}-compact`]: density === 'compact' }, dropdownClassName]} id={panelId} style={dropdownStyle}>
        <div class={`${prefixCls}-container`}>
            {#if leftSlot}
                <div class={`${prefixCls}-leftSlot`} x-semi-prop="leftSlot">{@render leftSlot()}</div>
            {/if}
            <div>
                {#if topSlot}
                    <div class={`${prefixCls}-topSlot`} x-semi-prop="topSlot">{@render topSlot()}</div>
                {/if}
                <!-- monthRange does not support presetPosition -->
                {#if presetPosition === 'top' && type !== 'monthRange'}
                    {@render quickControls()}
                {/if}
                {#if isYearOrMonth}
                    <YearAndMonth
                        currentMonth={yearMonth.month}
                        currentYear={yearMonth.year}
                        dateInput={insetInput ? insetDateInputSnippet : undefined}
                        {density}
                        disabledDate={(day) => foundation.disabledDisposeDate(day)}
                        {endYear}
                        locale={locale().locale}
                        monthCycled
                        noBackBtn
                        onSelect={foundation.handleYMSelectedChange}
                        {presetPosition}
                        quickControls={hasPresets ? quickControls : undefined}
                        {startYear}
                        {type}
                        {yearAndMonthOpts}
                    />
                {:else}
                    <MonthsGrid
                        {autoSwitchDate}
                        bind:this={monthsGrid}
                        {date}
                        dateFnsLocale={locale().dateFnsLocale}
                        dateInput={insetInput ? insetDateInputSnippet : undefined}
                        {defaultPickerValue}
                        {density}
                        disabledDate={foundation.disabledDisposeDate}
                        disabledTime={(day, panelType: PanelType) => foundation.disabledDisposeTime(day, panelType)}
                        {disabledTimePicker}
                        {endDateOffset}
                        {endYear}
                        focusRecords={states().focusRecords}
                        {format}
                        {fullDate}
                        hasOtherRangeInputBeenFocused={foundation.hasOtherRangeInputBeenFocused}
                        {hasPresets}
                        {hideDisabledOptions}
                        {insetInput}
                        isControlledComponent={!confirmNeeded && value !== undefined}
                        locale={locale().locale}
                        {max}
                        {multiple}
                        onChange={foundation.handleSelectedChange}
                        onPanelChange={(next, dateString) => onPanelChange?.(next, dateString)}
                        onRangeInputFocus={foundation.handleSetRangeFocus}
                        {presetPosition}
                        quickControls={hasPresets ? quickControls : undefined}
                        rangeInputFocus={states().rangeInputFocus}
                        selectedValue={states().cachedSelectedValue}
                        {startDateOffset}
                        {startYear}
                        {syncSwitchMonth}
                        {timePickerOpts}
                        timeZone={zone}
                        {type}
                        {weekStartsOn}
                        {yearAndMonthOpts}
                    />
                {/if}
                {#if presetPosition === 'bottom' && type !== 'monthRange'}
                    {@render quickControls()}
                {/if}
                {#if bottomSlot}
                    <div class={`${prefixCls}-bottomSlot`} x-semi-prop="bottomSlot">{@render bottomSlot()}</div>
                {/if}
            </div>
            {#if rightSlot}
                <div class={`${prefixCls}-rightSlot`} x-semi-prop="rightSlot">{@render rightSlot()}</div>
            {/if}
        </div>
        {#if confirmNeeded}
            <Footer disabledConfirm={confirmDisabled} locale={locale().locale} onCancel={foundation.handleCancel} onConfirm={foundation.handleConfirm} />
        {/if}
    </div>
{/snippet}

<div bind:this={root} {...attrs.root} aria-labelledby={hasRangeInputs ? (rest['aria-labelledby'] as string | undefined) : undefined} class={[prefixCls, rest.class]} role={rootRole}>
    <Popover
        afterClose={() => foundation.handlePanelVisibleChange(false)}
        aria-label={locale().locale.panel[type]}
        {autoAdjustOverflow}
        {content}
        {motion}
        onEscKeyDown={foundation.handleEscKeyDown}
        onOpen={() => foundation.handlePanelVisibleChange(true)}
        {position}
        spacing={normalized.spacing}
        {stopPropagation}
        trigger="custom"
        visible={panelShow}
    >
        {#snippet child({ props })}
            <!-- The inputs, or a focusable custom trigger, are the Tab stop; the wrapper is the button only while the trigger has no focus target of its own -->
            <div
                bind:this={combobox}
                {...props}
                aria-controls={isTriggerButton ? panelId : undefined}
                aria-describedby={isTriggerButton ? (rest['aria-describedby'] as string | undefined) : undefined}
                aria-disabled={isTriggerButton ? disabled : undefined}
                aria-errormessage={isTriggerButton ? (rest['aria-errormessage'] as string | undefined) : undefined}
                aria-expanded={isTriggerButton ? panelShow : undefined}
                aria-haspopup={isTriggerButton ? 'dialog' : undefined}
                aria-invalid={isTriggerButton ? (rest['aria-invalid'] as boolean | undefined) : undefined}
                aria-label={isTriggerButton && !rest['aria-labelledby'] ? triggerName : undefined}
                aria-labelledby={isTriggerButton ? (rest['aria-labelledby'] as string | undefined) : undefined}
                class={comboboxClass}
                role={isTriggerButton ? 'button' : undefined}
                tabindex={isTriggerButton && !disabled ? 0 : -1}
                onclick={(event) => foundation.handleTriggerClick(event, Boolean(trigger))}
                onkeydown={handleTriggerKeyDown}
            >
                {#if trigger}
                    {@render trigger(triggerProps)}
                {:else}
                    <DateInput
                        autofocus={states().autofocus}
                        bind:this={triggerInput}
                        borderless={isRangeType(type) ? false : borderless}
                        {clearIcon}
                        controlAttrs={{
                            ...attrs.control,
                            'aria-controls': panelId,
                            'aria-expanded': panelShow,
                            'aria-haspopup': 'dialog',
                            'aria-label': rest['aria-labelledby'] ? undefined : triggerName,
                            role: 'combobox',
                        }}
                        dateFnsLocale={locale().dateFnsLocale}
                        {defaultPickerValue}
                        disabled={inputDisabled}
                        {format}
                        inputReadOnly={inputReadOnly || Boolean(insetInput)}
                        {inputStyle}
                        inputValue={states().inputValue}
                        {insetLabel}
                        {insetLabelId}
                        onChange={foundation.handleInputChange}
                        onClear={foundation.handleInputClear}
                        onEnterPress={foundation.handleInputComplete}
                        onFocus={(event, range) => foundation.handleInputFocus(event, range as RangeInput)}
                        onRangeClear={foundation.handleRangeInputClear}
                        onRangeEndTabPress={foundation.handleRangeEndTabPress}
                        placeholder={shownPlaceholder}
                        {prefix}
                        rangeInputFocus={states().rangeInputFocus}
                        {rangeSeparator}
                        {rangeSeparatorNode}
                        {showClear}
                        showClearIgnoreDisabled={Boolean(insetInput)}
                        {size}
                        {type}
                        {validateStatus}
                        value={states().value}
                    />
                {/if}
            </div>
        {/snippet}
    </Popover>
</div>
