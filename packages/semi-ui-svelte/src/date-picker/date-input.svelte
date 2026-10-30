<script lang="ts">
    import { isSplitRangeInputs } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
    import { cssClasses } from '@fibrae/semi-foundation/date-picker/constants';
    import DateInputFoundation, { type DateInputAdapter, type DateInputFoundationProps, type InsetInputChangeFoundationProps, type InsetInputValue, type RangeInput } from '@fibrae/semi-foundation/date-picker/input-foundation';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import { IconCalendar, IconCalendarClock, IconClear } from '@fibrae/semi-icons-svelte';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { Input } from '../input/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import InsetInput from './inset-input.svelte';
    import type { DateInputProps } from './internal.js';

    const props: DateInputProps = $props();

    const locale = useLocale('DatePicker');

    let single = $state<Input>();
    let rangeStartInput = $state<Input>();
    let rangeEndInput = $state<Input>();
    let insetStart = $state<InsetInput>();
    let insetEnd = $state<InsetInput>();
    let focusedClearButton: HTMLButtonElement | undefined;

    const { foundation } = useFoundation<DateInputFoundation, DateInputAdapter, DateInputFoundationProps, Record<string, never>>(
        DateInputFoundation,
        props as DateInputFoundationProps,
        () => ({}),
        () => ({
            notifyChange: (value, event) => props.onChange?.(value, event),
            notifyEnter: (value) => props.onEnterPress?.(value),
            notifyClear: (event) => props.onClear?.(event),
            notifyRangeInputClear: (event) => props.onRangeClear?.(event),
            notifyRangeInputFocus: (event, rangeType) => props.onFocus?.(event, rangeType),
            notifyTabPress: (event) => props.onRangeEndTabPress?.(event),
            notifyInsetInputChange: (options) => props.onInsetInputChange?.(options),
        })
    );

    const prefix = cssClasses.PREFIX;
    const value = $derived(props.value ?? []);
    const isRange = $derived(isSplitRangeInputs(props.type));
    const text = $derived(DateInputFoundation.getShowText({ ...props, value }));
    const hasLabel = $derived(Boolean(props.prefix || props.insetLabel));
    const inputClass = $derived({ [`${prefix}-input-readonly`]: props.inputReadOnly, [`${prefix}-monthRange-input`]: props.type === 'monthRange' });
    const singlePlaceholder = $derived(props.type === 'monthRange' && Array.isArray(props.placeholder) ? props.placeholder[0] + props.rangeSeparator + props.placeholder[1] : (props.placeholder as string | undefined));
    const rangePlaceholder = $derived(Array.isArray(props.placeholder) ? props.placeholder : [props.placeholder, props.placeholder]);
    const inputSize = $derived(props.size === 'large' ? 'default' : 'small');

    const rangeParts = $derived.by(() => {
        const [start = '', end = ''] = text.split(props.rangeSeparator);
        return { start, end };
    });

    const allowRangeClear = $derived(DateInputFoundation.getRangeClearVisible({ ...rangeParts, showClear: props.showClear ?? true, disabled: props.disabled, showClearIgnoreDisabled: props.showClearIgnoreDisabled }));

    // a missing insetInputValue makes the foundation format `value` instead
    const insetValue = $derived(DateInputFoundation.getInsetInputValue(props, { value, insetInputValue: props.insetInputValue as InsetInputValue }));

    const insetPlaceholders = $derived.by(() => {
        const own = (typeof props.insetInput === 'object' && props.insetInput.placeholder) || {};
        const { datePlaceholder, timePlaceholder } = DateInputFoundation.getInsetInputPlaceholder(props);
        return {
            dateStart: own.dateStart ?? datePlaceholder,
            dateEnd: own.dateEnd ?? datePlaceholder,
            timeStart: own.timeStart ?? timePlaceholder,
            timeEnd: own.timeEnd ?? timePlaceholder,
        };
    });

    const insetNames = $derived(DateInputFoundation.getInsetNames(locale().locale, props.type));

    // The field's label names the group around the two inputs, not each input
    const rangeAttrs = $derived(Object.fromEntries(Object.entries(props.controlAttrs ?? {}).filter(([key]) => key !== 'aria-label' && key !== 'aria-labelledby')));

    const rangeValue = (start: string, end: string) => {
        return `${start}${props.rangeSeparator}${end}`;
    };

    const focusRange = (event: FocusEvent | MouseEvent, rangeType: RangeInput) => {
        foundation.handleRangeInputFocus(event, rangeType);
    };

    const focusStartOnClick = (event: MouseEvent) => {
        if (!props.disabled && !props.rangeInputFocus) {
            focusRange(event, 'rangeStart');
        }
    };

    const clickRange = (event: MouseEvent, rangeType: RangeInput) => {
        if (!props.disabled) {
            focusRange(event, rangeType);
        }
    };

    const changeInset = (options: InsetInputChangeFoundationProps) => {
        foundation.handleInsetInputChange(options);
    };

    // The clear button unmounts under focus whenever the value empties (own click, Enter, or the parent), which drops
    // focus to the body. Svelte patches the `{#if}` before any effect of this component runs, so the button's focus is
    // tracked by its focus events and the effect hands it to the start input after the patch. Chromium fires `blur`
    // while it removes the focused button, so a blur only counts if the button is still connected a microtask later.
    // The foundation clears on mousedown, before the browser would focus the button, so the pointer press stands in for
    // the button's focus; the default is prevented so the press cannot move focus to the trigger wrapper afterwards.
    // A controlled parent may reject the clear and keep the button, which then must not stay marked.
    const releaseIfConnected = (button: HTMLButtonElement) => {
        queueMicrotask(() => {
            if (button.isConnected) focusedClearButton = undefined;
        });
    };

    const clearRangeOnMouseDown = (event: MouseEvent & { currentTarget: HTMLButtonElement }) => {
        const button = event.currentTarget;
        if (event.button === 0) {
            focusedClearButton = button;
            event.preventDefault();
        }
        foundation.handleRangeInputClearMouseDown(event);
        if (event.button === 0) releaseIfConnected(button);
    };

    $effect(() => {
        if (!allowRangeClear && focusedClearButton) {
            const from = focusedClearButton;
            focusedClearButton = undefined;
            handoverFocus(from, rangeStartInput?.getInput());
        }
    });

    /** The single input of the trigger */
    export function getSingle() {
        return single ?? null;
    }

    /** The start input of a range trigger, or the first inset date input */
    export function getRangeStart() {
        return (props.insetInput ? insetStart : rangeStartInput) ?? null;
    }

    export function getRangeEnd() {
        return (props.insetInput ? insetEnd : rangeEndInput) ?? null;
    }
</script>

{#snippet calendarIcon()}
    {#if props.type.includes('Time')}
        <IconCalendarClock />
    {:else}
        <IconCalendar />
    {/if}
{/snippet}

{#if props.insetInput}
    <div {...{ 'x-type': props.type }} class={`${prefix}-inset-input-wrapper`}>
        <InsetInput ariaLabel={insetNames.start} bind:this={insetStart} insetInputValue={insetValue} kind="date" onChange={changeInset} onFocus={(event) => props.onInsetDateFocus?.(event, 'rangeStart')} panel="monthLeft" placeholder={insetPlaceholders.dateStart} type={props.type} />
        <InsetInput ariaLabel={insetNames.startTime} disabled={!insetValue.monthLeft.dateInput} insetInputValue={insetValue} kind="time" onChange={changeInset} onFocus={() => props.onInsetTimeFocus?.()} panel="monthLeft" placeholder={insetPlaceholders.timeStart} type={props.type} />
        {#if isRange}
            <div class={`${prefix}-inset-input-separator`}>{props.density === 'compact' ? '' : '-'}</div>
            <InsetInput ariaLabel={insetNames.end} bind:this={insetEnd} insetInputValue={insetValue} kind="date" onChange={changeInset} onFocus={(event) => props.onInsetDateFocus?.(event, 'rangeEnd')} panel="monthRight" placeholder={insetPlaceholders.dateEnd} type={props.type} />
            <InsetInput ariaLabel={insetNames.endTime} disabled={!insetValue.monthRight.dateInput} insetInputValue={insetValue} kind="time" onChange={changeInset} onFocus={() => props.onInsetTimeFocus?.()} panel="monthRight" placeholder={insetPlaceholders.timeEnd} type={props.type} />
        {/if}
    </div>
{:else if isRange}
    {#if hasLabel}
        <!-- The pointer target of the label only moves the focus to the start input. The id is what a Form inset label's aria-labelledby points at. -->
        <div class={`${prefix}-range-input-prefix`} id={props.prefix ? undefined : props.insetLabelId} x-semi-prop="prefix,insetLabel" onclick={focusStartOnClick}>
            {#if props.prefix}
                {@render props.prefix()}
            {:else if props.insetLabel}
                {@render props.insetLabel()}
            {/if}
        </div>
    {/if}
    <div
        class={[
            inputClass,
            `${prefix}-range-input-wrapper-start`,
            `${prefix}-range-input-wrapper`,
            {
                [`${prefix}-range-input-wrapper-active`]: props.rangeInputFocus === 'rangeStart' && !props.disabled,
                [`${prefix}-range-input-wrapper-start-with-prefix`]: hasLabel,
                [`${prefix}-borderless`]: props.borderless,
            },
        ]}
        onclick={(event) => clickRange(event, 'rangeStart')}
    >
        <!-- Fully controlled: the picker owns the text -->
        <Input
            bind:this={rangeStartInput}
            {...rangeAttrs}
            autofocus={props.autofocus}
            bind:value={() => rangeParts.start, () => {}}
            borderless={props.borderless}
            disabled={props.disabled}
            onChange={(next, event) => foundation.handleChange(rangeValue(next, rangeParts.end), event)}
            onEnterPress={(event) => foundation.handleRangeInputEnterPress(event, rangeValue(rangeParts.start, rangeParts.end))}
            onFocus={(event) => focusRange(event, 'rangeStart')}
            placeholder={rangePlaceholder[0]}
            readOnly={props.inputReadOnly}
            showClear={false}
            size={inputSize}
            style={props.inputStyle}
        />
    </div>
    <span class={[`${prefix}-range-input-separator`, { [`${prefix}-range-input-separator-active`]: Boolean(rangeParts.start || rangeParts.end) && !props.disabled }]} onclick={(event) => clickRange(event, 'rangeStart')}>
        {#if props.rangeSeparatorNode}
            {@render props.rangeSeparatorNode()}
        {:else}
            {props.rangeSeparator}
        {/if}
    </span>
    <div
        class={[
            inputClass,
            `${prefix}-range-input-wrapper-end`,
            `${prefix}-range-input-wrapper`,
            {
                [`${prefix}-range-input-wrapper-active`]: props.rangeInputFocus === 'rangeEnd' && !props.disabled,
                [`${prefix}-borderless`]: props.borderless,
            },
        ]}
        onclick={(event) => clickRange(event, 'rangeEnd')}
    >
        <Input
            bind:this={rangeEndInput}
            {...rangeAttrs}
            bind:value={() => rangeParts.end, () => {}}
            borderless={props.borderless}
            disabled={props.disabled}
            onChange={(next, event) => foundation.handleChange(rangeValue(rangeParts.start, next), event)}
            onEnterPress={(event) => foundation.handleRangeInputEnterPress(event, rangeValue(rangeParts.start, rangeParts.end))}
            onFocus={(event) => focusRange(event, 'rangeEnd')}
            onKeyDown={foundation.handleRangeInputEndKeyPress}
            placeholder={rangePlaceholder[1]}
            readOnly={props.inputReadOnly}
            showClear={false}
            size={inputSize}
            style={props.inputStyle}
        />
    </div>
    {#if allowRangeClear}
        <button aria-label={locale().locale.clearRange} class={`${prefix}-range-input-clearbtn`} type="button" onblur={(event) => releaseIfConnected(event.currentTarget)} onclick={foundation.handleRangeInputClearClick} onfocus={(event) => (focusedClearButton = event.currentTarget)} onmousedown={clearRangeOnMouseDown}>
            {#if props.clearIcon}
                {@render props.clearIcon()}
            {:else}
                <IconClear />
            {/if}
        </button>
    {/if}
    <div class={`${prefix}-range-input-suffix`} onclick={focusStartOnClick}>
        {@render calendarIcon()}
    </div>
{:else}
    <!-- Fully controlled: the picker owns the text -->
    <Input
        bind:this={single}
        {...props.controlAttrs}
        autofocus={props.autofocus}
        bind:value={() => text, () => {}}
        borderless={props.borderless}
        class={inputClass}
        clearIcon={props.clearIcon}
        disabled={props.disabled}
        hideSuffix={props.showClear}
        insetLabel={props.insetLabel}
        insetLabelId={props.insetLabelId}
        onChange={foundation.handleChange}
        onClear={(event) => {
            foundation.handleInputClear(event);
            // the Input clears on mousedown without moving focus, which leaves it on the body or the trigger wrapper
            single?.focus();
        }}
        onEnterPress={foundation.handleInputComplete}
        onFocus={(event) => props.onFocus?.(event)}
        placeholder={singlePlaceholder}
        prefix={props.prefix}
        readOnly={props.inputReadOnly}
        showClear={props.showClear}
        showClearIgnoreDisabled={props.showClearIgnoreDisabled}
        size={props.size}
        style={props.inputStyle}
        suffix={calendarIcon}
        validateStatus={props.validateStatus}
    />
{/if}
